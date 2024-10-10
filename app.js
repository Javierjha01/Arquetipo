const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./conexion'); 
const app = express();
const port = 3000;


app.use(bodyParser.json());
app.use(cors());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Permitir todos los orígenes
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Métodos permitidos
    res.header('Access-Control-Allow-Headers', 'Content-Type'); // Cabeceras permitidas
    next();
  });

// Clave secreta para JWT
const SECRET_KEY = 'mysecretkey';

// REGISTRAR USUARIO PARA LOGIN-----------------------------------------------------------------
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;

    // Encriptar la contraseña antes de guardarla
    const hashedPassword = bcrypt.hashSync(password, 8);

    // Insertar el usuario en la base de datos
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(query, [username, hashedPassword], (err, result) => {
        if (err) {
            console.error('Error al registrar usuario:', err);
            return res.status(500).send('Error al registrar usuario');
        }

        res.status(200).send({"statusCode":0, "statusMessage":"Usuario registrado con éxito"});
    });
});

// LOGIN-----------------------------------------------------------------
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Buscar el usuario en la base de datos
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).send({"statusCode":-1, "statusMessage":"Error en el servidor"});
        }

        if (results.length == 0) {
            return res.status(200).send({"statusCode":-1, "statusMessage":"Usuario y/o contraseña incorrectos"});
        }

        const user = results[0];
        // Comparar la contraseña proporcionada con la almacenada
        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(200).send({"statusCode":-1, "statusMessage":"Usuario y/o contraseña incorrectos"});
        }

        // Generar un token JWT
        const token = jwt.sign({ id: user.id }, SECRET_KEY, {
            expiresIn: 86400 // 24 horas
        });

        res.status(200).send({"statusCode":0, "statusMessage":"Servicio exitoso", "response": {auth: true, token}});
    });
});

// Ruta protegida que requiere autenticación------------------------------------------
app.get('/api/protected', (req, res) => {
    const token = req.headers['x-access-token'];

    if (!token) {
        return res.status(401).send('No se proporcionó un token');
    }

    // Verificar el token JWT
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(500).send('Token inválido');
        }

        res.status(200).send('Acceso permitido a la ruta protegida');
    });
});

//MOSTRAR TODOS LOS REGISTROS--------------------------------------------------
app.get('/api/proyectos', function(req, res){
    db.query('SELECT * FROM proyectos', function(error, proyectos){
        if(error){
            //console.log(error);
            return res.status(200).send({"statusCode":-1, "statusMessage":"Proyectos no encontrados"});
        }else{
            res.status(200).send({"statusCode":0, "statusMessage":"Servicio exitoso", "response": proyectos});
        }
    })
})
//MOSTRAR UN SOLO REGISTRO--------------------------------------------------
app.get('/api/proyectos/:id', function(req, res){
    db.query('SELECT * FROM proyectos where id = ?', [req.params.id], function(error, proyecto){
        if(error){
            return res.status(200).send({"statusCode":-1, "statusMessage":"Proyectos no encontrado"});
        }else{
            res.status(200).send({"statusCode":0, "statusMessage":"Servicio exitoso", "response": proyecto});
        }
    })
})

//INSERTAR UN REGISTRO--------------------------------------------------
app.post('/api/proyectos', function(req, res){
    const {nombre, descripcion, fecha_inicio, fecha_fin, responsables} = req.body;
    
    const sql = 'INSERT INTO proyectos(nombre, descripcion, fecha_inicio, fecha_fin, responsables) values (?, ?, ?, ?, ?)';

    db.query(sql, [nombre, descripcion, fecha_inicio, fecha_fin, responsables], function(error, registro){
        if(error){
            //console.log(error)
            return res.status(200).send({"statusCode":-1, "statusMessage":"No se pudo registrar el proyecto"});
        }
        else{
            res.status(200).send({"statusCode":0, "statusMessage":"Servicio exitoso", "response": registro});
            //console.log(sql)
        }
    })
})

//ACTUALIZAR REGISTRO------------------------------------------------------------------
app.put('/api/proyectos/:id', function(req, res){
    let id = req.params.id;
    let nombre = req.body.nombre;
    let descripcion = req.body.descripcion;
    let fecha_inicio = req.body.fecha_inicio;
    let fecha_fin = req.body.fecha_fin;
    let responsables = req.body.responsables;
    let sql = "UPDATE proyectos set nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, responsables = ? WHERE id = ?"

    db.query(sql, [nombre, descripcion, fecha_inicio, fecha_fin, responsables, id], function(error, actualizar){
        if(error){
            return res.status(200).send({"statusCode":-1, "statusMessage":"No se pudo actualizar el proyecto"});
        }
        else{
            res.status(200).send({"statusCode":0, "statusMessage":"Actualización exitoso", "response": actualizar});
        }
    });
});

//BORRAR UN REGISTRO--------------------------------------------------
app.delete('/api/proyectos/:id', function(req, res){
    db.query('DELETE FROM proyectos where id = ?', [req.params.id], function(error, borrar){
        if(error){
            return res.status(200).send({"statusCode":-1, "statusMessage":"No se pudo borrar el proyecto"});
        }else{
            res.status(200).send({"statusCode":0, "statusMessage":"Se borró con éxito", "response": borrar});
            
        }
    })
})


// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
