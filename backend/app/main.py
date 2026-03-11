from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.models.schemas import OptimizationRequest, OptimizationResponse
from app.algorithms.route_optimizer import route_optimizer
from app.config import settings
import time

app = FastAPI(
    title="Courier Route Optimizer",
    description="API для оптимизации маршрутов курьеров",
    version="1.0.0"
)

# CORS для фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "ok", "service": "Courier Route Optimizer API"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": time.time()}

@app.post("/api/optimize", response_model=OptimizationResponse)
def optimize_routes(request: OptimizationRequest):
    import traceback, logging
    try:
        logging.info(f"Starting optimization: {len(request.orders)} orders, {len(request.couriers)} couriers")
        
        result = route_optimizer.optimize(
            orders=request.orders,
            couriers=request.couriers,
            depot_lat=request.depot_latitude,
            depot_lon=request.depot_longitude
        )
        
        logging.info(f"Optimization result: {result.keys() if result else 'None'}")
        return OptimizationResponse(**result)
        
    except Exception as e:
        logging.error(f"ERROR: {str(e)}")
        logging.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"{str(e)}\n\n{traceback.format_exc()}")

@app.get("/api/route/geometry")
def get_route_geometry(coordinates: str):
    """
    Получение геометрии маршрута для отрисовки
    coordinates: "lon1,lat1;lon2,lat2;..."
    """
    try:
        coords_list = [tuple(map(float, c.split(","))) for c in coordinates.split(";")]
        geometry = route_optimizer.osrm.get_route_geometry(coords_list)
        return geometry
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)