import { RowDataPacket } from "mysql2";

interface IUser extends RowDataPacket{
    id: number,
    email: string,
    password_hash: string,
    google_id: string,
    name: string,
    role: string,
    created_at: string
}

export default IUser