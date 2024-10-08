const mysql = require('mysql2');

// Crear conexión a la base de datos
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',          // Cambia según tu configuración
    password: 'admin',  // Cambia según tu configuración
    database: 'arquetipo'    // Cambia por el nombre de tu base de datos
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos MySQL');
});

module.exports = connection;
