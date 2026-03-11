import React from 'react';
import { Typography, Tag } from 'antd';
import { OptimizedRoute } from '../types';
import { formatDistance, formatDuration, formatTime } from '../utils/helpers';

const { Text, Title } = Typography;

interface RouteListProps {
  routes: OptimizedRoute[];
}

const RouteList: React.FC<RouteListProps> = ({ routes }) => {
  if (routes.length === 0) {
    return null;
  }

  const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

  return (
    <div className="form-section">
      <div className="section-title">🗺️ Оптимизированные маршруты</div>
      
      {routes.map((route, index) => (
        <div key={route.courier_id} className="route-card optimized">
          <div className="route-header">
            <div className="route-number">
              🚴 Курьер #{route.courier_id}
            </div>
            <Tag color={colors[index % colors.length]}>
              {route.orders_count} заказов
            </Tag>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <Text type="secondary">
              📏 {formatDistance(route.total_distance_m)}
            </Text>
            <br />
            <Text type="secondary">
              ⏱️ {formatDuration(route.total_time_min)}
            </Text>
          </div>

          <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '8px' }}>
            <Text strong>Порядок доставки:</Text>
            {route.points.map((point, pointIndex) => (
              <div key={point.order_id} style={{ 
                padding: '4px 0', 
                borderBottom: '1px dashed #e8e8e8',
                marginLeft: '16px'
              }}>
                <Text>
                  {pointIndex + 1}. Заказ #{point.order_id} — {formatTime(point.arrival_time)}
                </Text>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RouteList;