import numpy as np
import time
from typing import List
from datetime import datetime, timedelta, timezone
from app.models.schemas import Order, Courier, OptimizedRoute, RoutePoint
from app.services.osrm_service import osrm_service
from app.algorithms.genetic_algorithm import GeneticAlgorithmVRP
from app.config import settings

class RouteOptimizer:
    def __init__(self):
        self.osrm = osrm_service
    
    def _prepare_matrices(self, orders: List[Order], depot_lat: float, 
                          depot_lon: float) -> tuple:
        """
        Подготовка матриц расстояний и времени через OSRM
        """
        # Координаты: депо + все заказы
        coordinates = [(depot_lon, depot_lat)] + [(o.longitude, o.latitude) for o in orders]
        
        # Запрос к OSRM
        matrix_data = self.osrm.get_route_matrix(coordinates)
        
        if matrix_data["code"] != "Ok":
            raise Exception("OSRM matrix request failed")
        
        distances = np.array(matrix_data["distances"])
        durations = np.array(matrix_data["durations"])
        
        return distances, durations, coordinates
    
    def _prepare_time_windows(self, orders: List[Order], start_time: datetime) -> List[tuple[int, int]]:
        """
        Преобразование временных окон в секунды от старта
        Приводит все datetime к одному формату (naive UTC)
        """
        # Приводим start_time к UTC и делаем naive, если нужно
        if start_time.tzinfo is not None:
            start_time = start_time.astimezone(timezone.utc).replace(tzinfo=None)
        
        windows = []
        for order in orders:
            # Приводим ready_time и deadline к naive UTC
            ready = order.ready_time
            deadline = order.deadline
            
            if ready.tzinfo is not None:
                ready = ready.astimezone(timezone.utc).replace(tzinfo=None)
            if deadline.tzinfo is not None:
                deadline = deadline.astimezone(timezone.utc).replace(tzinfo=None)
            
            earliest = int((ready - start_time).total_seconds())
            latest = int((deadline - start_time).total_seconds())
            
            # Гарантируем неотрицательные значения
            windows.append((max(0, earliest), max(earliest, latest)))
        
        return windows
    
    def optimize(self, orders: List[Order], couriers: List[Courier], 
                 depot_lat: float, depot_lon: float) -> dict:
        """
        Основная функция оптимизации
        """
        start_time = datetime.now(timezone.utc)
        computation_start = time.time()
        
        if not orders:
            return {"routes": [], "total_time_min": 0, "total_distance_m": 0, "computation_time_ms": 0}
        
        # 1. Подготовка матриц
        distances, durations, coordinates = self._prepare_matrices(orders, depot_lat, depot_lon)
        
        # 2. Подготовка параметров для ГА
        order_weights = [o.weight for o in orders]
        courier_caps = [c.capacity for c in couriers]
        time_windows = self._prepare_time_windows(orders, start_time)
        
        # 3. Запуск генетического алгоритма
        ga = GeneticAlgorithmVRP(
            distance_matrix=distances,
            time_matrix=durations,
            num_couriers=len(couriers),
            courier_capacities=courier_caps,
            order_weights=order_weights,
            time_windows=time_windows
        )
        
        best_individual, best_fitness = ga.optimize(verbose=False)
        
        # 4. Декодирование маршрутов
        routes_decoded = ga._decode_route(best_individual)
        
        # 5. Формирование ответа
        optimized_routes = []
        total_distance = 0
        total_time = 0
        
        for courier_idx, route in enumerate(routes_decoded):
            if len(route) <= 2:  # Только депо
                continue
            
            route_points = []
            route_distance = 0
            route_time = 0
            current_time = start_time
            
            for i in range(len(route) - 1):
                from_idx = route[i]
                to_idx = route[i + 1]
                
                if to_idx == 0:  # Возврат в депо
                    continue
                
                order = orders[to_idx - 1]
                travel_time_sec = durations[from_idx][to_idx]
                route_distance += distances[from_idx][to_idx]
                route_time += travel_time_sec
                
                arrival_time = current_time + timedelta(seconds=travel_time_sec)
                
                route_points.append(RoutePoint(
                    order_id=order.id,
                    latitude=order.latitude,
                    longitude=order.longitude,
                    arrival_time=arrival_time,
                    departure_time=arrival_time + timedelta(minutes=2)  # Время на передачу
                ))
                
                current_time = arrival_time + timedelta(minutes=2)
            
            optimized_routes.append(OptimizedRoute(
                courier_id=couriers[courier_idx % len(couriers)].id,
                points=route_points,
                total_distance_m=route_distance,
                total_time_min=route_time / 60,
                orders_count=len(route_points)
            ))
            
            total_distance += route_distance
            total_time += route_time
        
        computation_time = (time.time() - computation_start) * 1000
        
        return {
            "routes": optimized_routes,
            "total_time_min": total_time / 60,
            "total_distance_m": total_distance,
            "computation_time_ms": computation_time
        }

route_optimizer = RouteOptimizer()