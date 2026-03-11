import requests
from typing import List, Tuple
from app.config import settings

class OSRMService:
    def __init__(self):
        self.base_url = settings.OSRM_URL
        self.profile = settings.OSRM_PROFILE
    
    def get_route_matrix(self, coordinates: List[Tuple[float, float]]) -> dict:
        """
        Получает матрицу времени и расстояний между точками
        coordinates: список кортежей (longitude, latitude)
        """
        if len(coordinates) > 100:  # OSRM имеет лимит
            coordinates = coordinates[:100]
        
        coords_str = ";".join([f"{lon},{lat}" for lon, lat in coordinates])
        
        url = f"{self.base_url}/table/v1/{self.profile}/{coords_str}"
        params = {"annotations": "distance,duration"}
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            return {
                "durations": data["durations"],  # матрица времени в секундах
                "distances": data["distances"],  # матрица расстояний в метрах
                "code": data["code"]
            }
        except Exception as e:
            print(f"OSRM Error: {e}")
            return {"durations": [], "distances": [], "code": "Error"}
    
    def get_route_geometry(self, coordinates: List[Tuple[float, float]]) -> dict:
        """
        Получает геометрию маршрута для отрисовки на карте
        """
        coords_str = ";".join([f"{lon},{lat}" for lon, lat in coordinates])
        
        url = f"{self.base_url}/route/v1/{self.profile}/{coords_str}"
        params = {"overview": "full", "geometries": "geojson"}
        
        try:
            response = requests.get(url, params=params, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"OSRM Geometry Error: {e}")
            return {}

osrm_service = OSRMService()