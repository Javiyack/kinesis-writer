const express = require('express');
const AWS = require('aws-sdk');
const { exec } = require('child_process');
const app = express();

// Configura la región
AWS.config.update({ region: 'us-east-1' }); // Reemplaza 'us-east-1' con tu región preferida

// Configurar el AWS SDK para apuntar al endpoint de LocalStack
const kinesis = new AWS.Kinesis({
    endpoint: 'http://localhost:4566',
    region: 'us-east-1', // Reemplaza con tu región preferida
    accessKeyId: 'localstack', // Reemplaza con tus propias credenciales de acceso
    secretAccessKey: 'localstack', // Reemplaza con tus propias credenciales de acceso
});

// Configurar el AWS SDK para apuntar al endpoint de LocalStack
const lambda = new AWS.Lambda({
    endpoint: 'http://localhost:4566',
    region: 'us-east-1', // Reemplaza con tu región preferida
    accessKeyId: 'localstack', // Reemplaza con tus propias credenciales de acceso
    secretAccessKey: 'localstack', // Reemplaza con tus propias credenciales de acceso
});

// Configurar el AWS SDK para apuntar al endpoint de LocalStack
const dynamodb = new AWS.DynamoDB({
    endpoint: 'http://localhost:4566',
    region: 'us-east-1', // Reemplaza con tu región preferida
    accessKeyId: 'localstack', // Reemplaza con tus propias credenciales de acceso
    secretAccessKey: 'localstack', // Reemplaza con tus propias credenciales de acceso
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configurar ruta para servir el archivo index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Ruta para recibir los datos del formulario
app.post('/write-to-kinesis', (req, res) => {
    const { data } = req.body;

    // Parámetros para escribir en el stream de Kinesis
    const params = {
        Data: JSON.stringify(data),
        PartitionKey: 'your-partition-key',
        StreamName: 'my-stream',
    };

    // Llama a la función putRecord para escribir en el stream
    kinesis.putRecord(params, (err, data) => {
        if (err) {
            console.log(err, err.stack);
            res.status(500).send('Error al escribir en Kinesis');
        } else {
            console.log('Datos escritos en Kinesis!:', data);
            res.status(200).send('Datos escritos en Kinesis');
        }
    });
});

app.get('/list-streams', (req, res) => {

    kinesis.listStreams({}, (err, data) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: `ERROR al listar los streams de Kinesis: ${err}` });
        } else {
            res.status(200).json(data.StreamNames);
        }
    });
});

// Ruta para ejecutar el comando y obtener la lista de streams
app.get('/list-streams1', (req, res) => {
    const command = 'aws --endpoint-url=http://localhost:4566 kinesis list-streams';

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`Error al ejecutar el comando: ${error}`);
            res.status(500).json({ error: 'Error al obtener la lista de streams de Kinesis' });
        } else {
            const result = JSON.parse(stdout);
            console.log("result=" + JSON.stringify(result))
            console.log("StreamNames=" + result.StreamNames)
            const streamList = stdout.trim().split('\n').map(stream => stream.trim());
            res.status(200).json(result.StreamNames);
        }
    });
});

// Ruta para consultar las funciones Lambda en LocalStack
app.get('/list-lambdas', async (req, res) => {
    console.log('/list-lambdas:');
    try {
        const response = await lambda.listFunctions().promise();
        const functionNames = response.Functions.map(func => func.FunctionName);
        res.status(200).json(functionNames);
    } catch (error) {
        console.error('Error al consultar las funciones Lambda:', error);
        res.status(500).send('Error al consultar las funciones Lambda.');
    }
});

// Ruta para consultar las tablas de DynamoDB en LocalStack
app.get('/list-tables', async (req, res) => {
    console.log('/list-tables:');
    try {
        console.log('Tablas de DynamoDB:');
        const response = await dynamodb.listTables().promise();
        const tableNames = response.TableNames;
        console.log('Tablas de DynamoDB:', response);
        res.status(200).json(tableNames);
    } catch (error) {
        console.log(`Error al ejecutar el comando list-tables: ${error}`);
        console.log('Error al consultar las tablas de DynamoDB:', error);
        res.status(500).send('Error al consultar las tablas de DynamoDB.');
    }
});


app.get('/list-tables1', async (req, res) => {
    const command = 'aws dynamodb list-tables --endpoint-url http://localhost:4566';

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.log(`Error al ejecutar el comando: ${error}`);
            res.status(500).json({ error: 'Error al obtener la lista de streams de Kinesis' });
        } else {
            const result = JSON.parse(stdout);
            console.log("result=" + JSON.stringify(result))
            console.log("StreamNames=" + result.TableNames)
            const streamList = stdout.trim().split('\n').map(stream => stream.trim());
            res.status(200).json(result.TableNames);
        }
    });
});
// Inicia el servidor
app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});
