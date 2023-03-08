const oracledb = require('oracledb');

async function connectToDB() {
  try {
    const connection = await oracledb.getConnection({
        user: 'SYSTEM',
        password: 'root123',
        connectString: '(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=CIPL1117UI)(PORT=1522))(CONNECT_DATA=(SERVER=DEDICATED)(SID=xe)))',
    });
    console.log('Connected to Oracle Database');
    return connection;
  } catch (err) {
    console.error(err);
  }
}

module.exports = connectToDB;