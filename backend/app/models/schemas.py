from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Order(BaseModel):
    id: int
    latitude: float
    longitude: float
    ready_time: datetime  # Когда заказ готов
    deadline: datetime   # Дедлайн доставки
    weight: float = 1.0  # Вес заказа (условные единицы)
    address: Optional[str] = None
    
class Courier(BaseModel):
    id: int
    type: str = "bicycle"  # "bicycle" или "foot"
    capacity: float = 10.0  # Грузоподъёмность
    speed_kmh: float = 15.0  # Средняя скорость
    
class RoutePoint(BaseModel):
    order_id: int
    latitude: float
    longitude: float
    arrival_time: datetime
    departure_time: datetime
    
class OptimizedRoute(BaseModel):
    courier_id: int
    points: List[RoutePoint]
    total_distance_m: float
    total_time_min: float
    orders_count: int
    
class OptimizationRequest(BaseModel):
    orders: List[Order]
    couriers: List[Courier]
    depot_latitude: float
    depot_longitude: float
    
class OptimizationResponse(BaseModel):
    routes: List[OptimizedRoute]
    total_time_min: float
    total_distance_m: float
    computation_time_ms: float