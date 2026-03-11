import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Order, OptimizedRoute, Depot, RoutePoint } from '../types';
import { api } from '../services/api';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface MapProps {
  orders: Order[];
  routes: OptimizedRoute[];
  depot: Depot;
}

interface RouteGeometry {
  courierId: number;
  coordinates: [number, number][]; // [lat, lng]
  color: string;
}

const Map: React.FC<MapProps> = ({ orders, routes, depot }) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.7558, 37.6173]);
  const [routeGeometries, setRouteGeometries] = useState<RouteGeometry[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

  // Функция для получения геометрии маршрута от OSRM
  const fetchRouteGeometry = async (points: RoutePoint[]): Promise<[number, number][]> => {
    if (points.length === 0) return [];

    // Формируем координаты: депо → точки → депо
    const coordinates = [
      `${depot.longitude},${depot.latitude}`,
      ...points.map(p => `${p.longitude},${p.latitude}`),
      `${depot.longitude},${depot.latitude}`
    ].join(';');

    try {
      const response = await api.getRouteGeometry(coordinates);
      
      if (response.routes && response.routes[0]?.geometry?.coordinates) {
        // OSRM возвращает [lng, lat], а Leaflet нужно [lat, lng]
        return response.routes[0].geometry.coordinates.map((coord: [number, number]) => [
          coord[1], // lat
          coord[0]  // lng
        ]);
      }
    } catch (error) {
      console.error('Error fetching route geometry:', error);
    }

    return [];
  };

  // Загружаем геометрию маршрутов при изменении routes
  useEffect(() => {
    const loadGeometries = async () => {
      if (routes.length === 0) {
        setRouteGeometries([]);
        return;
      }

      setLoadingRoutes(true);
      
      try {
        const geometries: RouteGeometry[] = [];
        
        for (let i = 0; i < routes.length; i++) {
          const route = routes[i];
          const coords = await fetchRouteGeometry(route.points);
          
          if (coords.length > 0) {
            geometries.push({
              courierId: route.courier_id,
              coordinates: coords,
              color: colors[i % colors.length]
            });
          }
        }
        
        setRouteGeometries(geometries);
      } catch (error) {
        console.error('Error loading route geometries:', error);
      } finally {
        setLoadingRoutes(false);
      }
    };

    loadGeometries();
  }, [routes, depot]);

  // Обновляем центр карты
  useEffect(() => {
    if (orders.length > 0 || routes.length > 0) {
      const allPoints: Array<[number, number]> = [
        [depot.latitude, depot.longitude],
        ...orders.map(o => [o.latitude, o.longitude] as [number, number])
      ];
      
      const center = allPoints.reduce(
        (acc, point) => [acc[0] + point[0] / allPoints.length, acc[1] + point[1] / allPoints.length],
        [0, 0]
      ) as [number, number];
      
      setMapCenter(center);
    }
  }, [orders, routes, depot]);

  return (
    <MapContainer 
      center={mapCenter} 
      zoom={13} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Depot marker */}
      <Circle
        center={[depot.latitude, depot.longitude]}
        radius={100}
        pathOptions={{ color: '#722ed1', fillColor: '#722ed1', fillOpacity: 0.5 }}
      >
        <Popup>🏪 Ресторан (Депо)</Popup>
      </Circle>

      {/* Order markers */}
      {orders.map((order, index) => (
        <Marker 
          key={order.id} 
          position={[order.latitude, order.longitude]}
        >
          <Popup>
            <div>
              <strong>Заказ #{order.id}</strong><br />
              Вес: {order.weight} кг<br />
              Готов: {new Date(order.ready_time).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}<br />
              Дедлайн: {new Date(order.deadline).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Route lines с реальной геометрией от OSRM */}
      {loadingRoutes && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}>
          🔄 Загрузка маршрутов...
        </div>
      )}

      {routeGeometries.map((geometry) => (
        <Polyline
          key={geometry.courierId}
          positions={geometry.coordinates}
          pathOptions={{ 
            color: geometry.color,
            weight: 5,
            opacity: 0.8
          }}
        />
      ))}

      {/* Маркеры точек доставки с номерами */}
      {routes.map((route, routeIndex) => 
        route.points.map((point, pointIndex) => (
          <Marker
            key={`${route.courier_id}-${point.order_id}`}
            position={[point.latitude, point.longitude]}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="background-color: ${colors[routeIndex % colors.length]}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${pointIndex + 1}</div>`,
              iconSize: [28, 28],
              iconAnchor: [14, 14]
            })}
          >
            <Popup>
              <div>
                <strong>Курьер #{route.courier_id}</strong><br />
                Точка #{pointIndex + 1}<br />
                Заказ #{point.order_id}<br />
                Прибытие: {new Date(point.arrival_time).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}
              </div>
            </Popup>
          </Marker>
        ))
      )}
    </MapContainer>
  );
};

export default Map;