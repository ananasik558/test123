import React, { useState } from 'react';
import { Layout, Button, message, Spin } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import Header from './components/Header';
import Map from './components/Map';
import OrderForm from './components/OrderForm';
import CourierForm from './components/CourierForm';
import DepotForm from './components/DepotForm';
import Stats from './components/Stats';
import RouteList from './components/RouteList';
import { api } from './services/api';
import { Order, Courier, Depot, OptimizationResponse } from './types';
import './index.css';

const { Content, Sider } = Layout;

function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);  // ← ИСПРАВЛЕНО
  const [depot, setDepot] = useState<Depot>({
    latitude: 55.7558,
    longitude: 37.6173,
    address: 'Красная площадь, 1'
  });
  const [result, setResult] = useState<OptimizationResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    if (orders.length === 0) {
      message.warning('Добавьте хотя бы один заказ');
      return;
    }

    if (couriers.length === 0) {
      message.warning('Добавьте хотя бы одного курьера');
      return;
    }

    setLoading(true);
    
    try {
      const request = {
        orders,
        couriers,
        depot_latitude: depot.latitude,
        depot_longitude: depot.longitude
      };

      const response = await api.optimizeRoutes(request);
      setResult(response);
      message.success(`Маршруты оптимизированы! Время вычисления: ${(response.computation_time_ms / 1000).toFixed(2)} сек`);
    } catch (error) {
      console.error('Optimization error:', error);
      message.error('Ошибка при оптимизации маршрутов. Проверьте логи.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setOrders([]);
    setCouriers([]);
    setResult(null);
    message.info('Все данные очищены');
  };

  return (
    <Layout className="app-container">
      <Header />
      <Layout className="main-content">
        <Sider width={400} theme="light" className="sidebar">
          <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
            <DepotForm depot={depot} setDepot={setDepot} />
            <OrderForm orders={orders} setOrders={setOrders} />
            <CourierForm couriers={couriers} setCouriers={setCouriers} />
            
            <div style={{ marginTop: '24px' }}>
              <Button 
                type="primary" 
                size="large"
                className="optimize-btn"
                icon={<RocketOutlined />}
                onClick={handleOptimize}
                loading={loading}
                disabled={orders.length === 0 || couriers.length === 0}
              >
                🚀 Оптимизировать маршруты
              </Button>
              
              <Button 
                size="large"
                className="optimize-btn"
                style={{ marginTop: '8px' }}
                onClick={handleClearAll}
              >
                Очистить всё
              </Button>
            </div>

            <Stats result={result} loading={loading} />
            
            {result && <RouteList routes={result.routes} />}
          </div>
        </Sider>
        
        <Content className="map-container">
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              background: 'rgba(255,255,255,0.8)'
            }}>
              <Spin size="large" tip="Оптимизация маршрутов..." />
            </div>
          ) : (
            <Map orders={orders} routes={result?.routes || []} depot={depot} />
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;