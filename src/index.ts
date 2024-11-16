import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

const app = express();
const port = 3000;
const uri = 'mongodb://localhost:27017';


app.use(cors());
app.use(express.json());

// Tabla Z
const zTable = new Map<string, number>();

function fillZTable() {
    
    zTable.set('-3.00', 0.0013); zTable.set('-2.90', 0.0019); zTable.set('-2.80', 0.0026);
    zTable.set('-2.70', 0.0035); zTable.set('-2.60', 0.0047); zTable.set('-2.50', 0.0062);
    zTable.set('-2.40', 0.0082); zTable.set('-2.30', 0.0107); zTable.set('-2.20', 0.0139);
    zTable.set('-2.10', 0.0179); zTable.set('-2.00', 0.0228); zTable.set('-1.90', 0.0287);
    zTable.set('-1.80', 0.0359); zTable.set('-1.70', 0.0446); zTable.set('-1.60', 0.0548);
    zTable.set('-1.50', 0.0668); zTable.set('-1.40', 0.0808); zTable.set('-1.30', 0.0968);
    zTable.set('-1.20', 0.1151); zTable.set('-1.10', 0.1357); zTable.set('-1.00', 0.1587);
    zTable.set('-0.90', 0.1841); zTable.set('-0.80', 0.2119); zTable.set('-0.70', 0.2420);
    zTable.set('-0.60', 0.2743); zTable.set('-0.50', 0.3085); zTable.set('-0.40', 0.3446);
    zTable.set('-0.30', 0.3821); zTable.set('-0.20', 0.4207); zTable.set('-0.10', 0.4602);
    zTable.set('0.00', 0.5000);

    zTable.set('0.10', 0.5398); zTable.set('0.20', 0.5793); zTable.set('0.30', 0.6179);
    zTable.set('0.40', 0.6554); zTable.set('0.50', 0.6915); zTable.set('0.60', 0.7257);
    zTable.set('0.70', 0.7580); zTable.set('0.80', 0.7881); zTable.set('0.90', 0.8159);
    zTable.set('1.00', 0.8413); zTable.set('1.10', 0.8643); zTable.set('1.20', 0.8849);
    zTable.set('1.30', 0.9032); zTable.set('1.40', 0.9192); zTable.set('1.50', 0.9332);
    zTable.set('1.60', 0.9452); zTable.set('1.70', 0.9554); zTable.set('1.80', 0.9641);
    zTable.set('1.90', 0.9713); zTable.set('2.00', 0.9772); zTable.set('2.10', 0.9821);
    zTable.set('2.20', 0.9861); zTable.set('2.30', 0.9893); zTable.set('2.40', 0.9918);
    zTable.set('2.50', 0.9938); zTable.set('2.60', 0.9953); zTable.set('2.70', 0.9965);
    zTable.set('2.80', 0.9974); zTable.set('2.90', 0.9981); zTable.set('3.00', 0.9987);
}

// Funciones de cálculo
function calculateAverage(data: number[]): number {
    const sum = data.reduce((acc, value) => acc + value, 0);
    return sum / data.length;
}

function calculateStandardDeviation(data: number[], mean: number): number {
    const variance = data.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / data.length;
    return Math.sqrt(variance);
}

function calculateZScore(x: number, mean: number, stdDev: number): number {
    return (x - mean) / stdDev;
}

function findClosestProbability(zScore: number): number {
    const roundedZ = (Math.round(zScore * 10) / 10).toFixed(2);
    const key = roundedZ.toString();
    
    if (zTable.has(key)) {
        return zTable.get(key)!;
    } else {
        let closestZ = Array.from(zTable.keys()).reduce((prev, curr) => {
            return Math.abs(parseFloat(curr) - zScore) < Math.abs(parseFloat(prev) - zScore) 
                ? curr 
                : prev;
        });
        return zTable.get(closestZ)!;
    }
}

// Inicializar tabla Z
fillZTable();

// Endpoints
app.get('/api/raw-data', async (req, res) => {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const database = client.db('graindb');
        const collection = database.collection('grainsensors');
        
        const data = await collection.find({}, {
            projection: {
                temperature_outside: 1,
                temperature_inside: 1,
                humidity: 1,
                gas: 1,
                timestamp: 1,
                _id: 0
            }
        }).toArray();
        
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener los datos' });
    } finally {
        await client.close();
    }
});

app.get('/api/statistics', async (req, res) => {
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const database = client.db('graindb');
        const collection = database.collection('grainsensors');
        
        const data = await collection.find({}, {
            projection: {
                temperature_outside: 1,
                temperature_inside: 1,
                humidity: 1,
                gas: 1,
                _id: 0
            }
        }).toArray();

        
        const temperaturesOutside = data.map(record => record.temperature_outside);
        const temperaturesInside = data.map(record => record.temperature_inside);
        const humidities = data.map(record => record.humidity);
        const gases = data.map(record => record.gas);

      
        const limits = {
            temperature: { min: 10, max: 30 },
            humidity: { min: 8, max: 14 },
            gas: { min: 0, max: 800 }
        };

        const stats = {
            temperature_outside: {
                average: calculateAverage(temperaturesOutside),
                std_dev: calculateStandardDeviation(temperaturesOutside, calculateAverage(temperaturesOutside)),
                probabilities: {
                    below_min: 0,
                    above_max: 0,
                    within_limits: 0
                }
            },
            temperature_inside: {
                average: calculateAverage(temperaturesInside),
                std_dev: calculateStandardDeviation(temperaturesInside, calculateAverage(temperaturesInside)),
                probabilities: {
                    below_min: 0,
                    above_max: 0,
                    within_limits: 0
                }
            },
            humidity: {
                average: calculateAverage(humidities),
                std_dev: calculateStandardDeviation(humidities, calculateAverage(humidities)),
                probabilities: {
                    below_min: 0,
                    above_max: 0,
                    within_limits: 0
                }
            },
            gas: {
                average: calculateAverage(gases),
                std_dev: calculateStandardDeviation(gases, calculateAverage(gases)),
                probabilities: {
                    below_min: 0,
                    above_max: 0,
                    within_limits: 0
                }
            }
        };

        //  temperatura externa
        const zTempOutMin = calculateZScore(limits.temperature.min, stats.temperature_outside.average, stats.temperature_outside.std_dev);
        const zTempOutMax = calculateZScore(limits.temperature.max, stats.temperature_outside.average, stats.temperature_outside.std_dev);
        stats.temperature_outside.probabilities.below_min = findClosestProbability(zTempOutMin) * 100;
        stats.temperature_outside.probabilities.above_max = (1 - findClosestProbability(zTempOutMax)) * 100;
        stats.temperature_outside.probabilities.within_limits = (findClosestProbability(zTempOutMax) - findClosestProbability(zTempOutMin)) * 100;

        // temperatura interna
        const zTempInMin = calculateZScore(limits.temperature.min, stats.temperature_inside.average, stats.temperature_inside.std_dev);
        const zTempInMax = calculateZScore(limits.temperature.max, stats.temperature_inside.average, stats.temperature_inside.std_dev);
        stats.temperature_inside.probabilities.below_min = findClosestProbability(zTempInMin) * 100;
        stats.temperature_inside.probabilities.above_max = (1 - findClosestProbability(zTempInMax)) * 100;
        stats.temperature_inside.probabilities.within_limits = (findClosestProbability(zTempInMax) - findClosestProbability(zTempInMin)) * 100;

        //  humedad
        const zHumMin = calculateZScore(limits.humidity.min, stats.humidity.average, stats.humidity.std_dev);
        const zHumMax = calculateZScore(limits.humidity.max, stats.humidity.average, stats.humidity.std_dev);
        stats.humidity.probabilities.below_min = findClosestProbability(zHumMin) * 100;
        stats.humidity.probabilities.above_max = (1 - findClosestProbability(zHumMax)) * 100;
        stats.humidity.probabilities.within_limits = (findClosestProbability(zHumMax) - findClosestProbability(zHumMin)) * 100;

        // gas
        const zGasMin = calculateZScore(limits.gas.min, stats.gas.average, stats.gas.std_dev);
        const zGasMax = calculateZScore(limits.gas.max, stats.gas.average, stats.gas.std_dev);
        stats.gas.probabilities.below_min = findClosestProbability(zGasMin) * 100;
        stats.gas.probabilities.above_max = (1 - findClosestProbability(zGasMax)) * 100;
        stats.gas.probabilities.within_limits = (findClosestProbability(zGasMax) - findClosestProbability(zGasMin)) * 100;

        res.json({
            success: true,
            stats,
            limits
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al calcular las estadísticas' });
    } finally {
        await client.close();
    }
});
app.get('/api/movement-statistics', async (req, res) => {
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const database = client.db('graindb');
        const collection = database.collection('grainsensors');

        
        const data = await collection.find({}, {
            projection: {
                movement_1: 1,
                movement_2: 1,
                timestamp: 1,
                _id: 0
            }
        }).toArray();

      
        const movements = data.map(record => {
            return record.movement_1 || record.movement_2; 
        });

       
        const totalRecords = movements.length;
        const movementCount = movements.filter(movement => movement === true).length;

        
        const movementProbability = (movementCount / totalRecords) * 100;

        res.json({
            success: true,
            stats: {
                totalRecords,
                movementCount,
                movementProbability
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al calcular las estadísticas de movimiento' });
    } finally {
        await client.close();
    }
});




app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

export default app;