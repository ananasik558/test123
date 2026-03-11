import React from 'react';
import { Form, Input, InputNumber, Button, Space, Typography, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Order } from '../types';
import { generateId } from '../utils/helpers';
import dayjs, { Dayjs } from 'dayjs';

const { Text } = Typography;

interface OrderFormProps {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ orders, setOrders }) => {
  const [form] = Form.useForm();

  const handleAddOrder = () => {
    form.validateFields().then((values) => {
      const newOrder: Order = {
        id: generateId(),
        latitude: values.latitude,
        longitude: values.longitude,
        ready_time: values.ready_time.toISOString(),  // ✅ "2026-03-11T12:00:00.000Z"
        deadline: values.deadline.toISOString(),
        weight: values.weight,
        address: values.address
      };
      
      setOrders([...orders, newOrder]);
      form.resetFields();
    });
  };

  const handleRemoveOrder = (id: number) => {
    setOrders(orders.filter(o => o.id !== id));
  };

  const handleAddSampleOrders = () => {
    const now = dayjs();
    const sampleOrders: Order[] = [
      {
        id: generateId(),
        latitude: 55.7558,
        longitude: 37.6173,
        ready_time: now.format('YYYY-MM-DDTHH:mm:ss'),
        deadline: now.add(30, 'minute').format('YYYY-MM-DDTHH:mm:ss'),
        weight: 1.5,
        address: 'Красная площадь, 1'
      },
      {
        id: generateId(),
        latitude: 55.7512,
        longitude: 37.6184,
        ready_time: now.format('YYYY-MM-DDTHH:mm:ss'),
        deadline: now.add(30, 'minute').format('YYYY-MM-DDTHH:mm:ss'),
        weight: 2.0,
        address: 'ул. Большая Дмитровка, 5'
      },
      {
        id: generateId(),
        latitude: 55.7489,
        longitude: 37.6231,
        ready_time: now.format('YYYY-MM-DDTHH:mm:ss'),
        deadline: now.add(30, 'minute').format('YYYY-MM-DDTHH:mm:ss'),
        weight: 1.0,
        address: 'Театральный проезд, 2'
      }
    ];
    
    setOrders([...orders, ...sampleOrders]);
  };

  return (
    <div className="form-section">
      <div className="section-title">📦 Заказы</div>
      
      <Form form={form} layout="vertical">
        <Form.Item
          name="latitude"
          label="Широта"
          rules={[{ required: true, message: 'Введите широту' }]}
          initialValue={55.75}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            min={-90} 
            max={90} 
            step={0.0001}
            placeholder="55.7558"
          />
        </Form.Item>

        <Form.Item
          name="longitude"
          label="Долгота"
          rules={[{ required: true, message: 'Введите долготу' }]}
          initialValue={37.62}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            min={-180} 
            max={180} 
            step={0.0001}
            placeholder="37.6173"
          />
        </Form.Item>

        <Form.Item
          name="address"
          label="Адрес"
        >
          <Input placeholder="ул. Примерная, д. 1" />
        </Form.Item>

        <Form.Item
          name="weight"
          label="Вес заказа (кг)"
          rules={[{ required: true }]}
          initialValue={1.0}
        >
          <InputNumber style={{ width: '100%' }} min={0.1} max={20} step={0.1} />
        </Form.Item>

        <Form.Item
          name="ready_time"
          label="Время готовности"
          rules={[{ required: true }]}
          initialValue={dayjs()}
        >
          <DatePicker 
            showTime 
            style={{ width: '100%' }} 
            format="HH:mm"
          />
        </Form.Item>

        <Form.Item
          name="deadline"
          label="Дедлайн доставки"
          rules={[{ required: true }]}
          initialValue={dayjs().add(30, 'minute')}
        >
          <DatePicker 
            showTime 
            style={{ width: '100%' }} 
            format="HH:mm"
          />
        </Form.Item>

        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleAddOrder}
          style={{ width: '100%', marginBottom: '8px' }}
        >
          Добавить заказ
        </Button>
        
        <Button 
          onClick={handleAddSampleOrders}
          style={{ width: '100%' }}
        >
          + 3 тестовых заказа
        </Button>
      </Form>

      <div style={{ marginTop: '16px' }}>
        <Text strong>Добавлено заказов: {orders.length}</Text>
        
        {orders.map((order, index) => (
          <div key={order.id} className="order-item">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Заказ #{index + 1}</Text><br />
                <Text type="secondary">
                  {order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}
                </Text><br />
                <Text>Вес: {order.weight} кг</Text><br />
                <Text>
                  {dayjs(order.ready_time).format('HH:mm')} - {dayjs(order.deadline).format('HH:mm')}
                </Text>
              </div>
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => handleRemoveOrder(order.id)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderForm;