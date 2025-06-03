import mysql from "mysql2/promise";
import { checkEnvVars } from "./utils";
import AppConfig from "../appconfig";

checkEnvVars(["DB_USER", "DB_PASSWORD"]);

const pool = mysql.createPool({
  host: AppConfig.db_host,
  port: AppConfig.db_port,
  database: AppConfig.db_name,
  user: process.env.DB_USER as string,
  password: process.env.DB_PASSWORD as string,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  multipleStatements: true,
});

export default pool;
