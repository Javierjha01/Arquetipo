const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const db = require('./conexion'); 
const app = express();
const port = 3000;


app.use(bodyParser.json());

// Clave secreta para JWT
const SECRET_KEY = 'mysecretkey';

// REGISTRAR-----------------------------------------------------------------
app.post('/register', (req, res) => {
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

        res.status(201).send('Usuario registrado con éxito');
    });
});

// INGRESAR-----------------------------------------------------------------
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Buscar el usuario en la base de datos
    const query = 'SELECT * FROM users WHERE username = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error en la consulta:', err);
            return res.status(500).send('Error en el servidor');
        }

        if (results.length === 0) {
            return res.status(404).send('Usuario no encontrado');
        }

        const user = results[0];

        // Comparar la contraseña proporcionada con la almacenada
        const passwordIsValid = bcrypt.compareSync(password, user.password);

        if (!passwordIsValid) {
            return res.status(401).send('Contraseña incorrecta');
        }

        // Generar un token JWT
        const token = jwt.sign({ id: user.id }, SECRET_KEY, {
            expiresIn: 86400 // 24 horas
        });

        res.status(200).send({ auth: true, token });
    });
});

// Ruta protegida que requiere autenticación
app.get('/protected', (req, res) => {
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

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});
