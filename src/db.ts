import dotenv from 'dotenv';
import { Database } from 'sqlite3';

dotenv.config();

const DB_PATH = process.env.DB_PATH || 'messages.sqlite';

const db = new Database(DB_PATH);

interface Message {
    username: string;
    content: string;
    role: string;
    timestamp: string;
};

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, content TEXT NOT NULL, role TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
});

export function insertMessage(username: string, content: string, role: string) {
    db.run('INSERT INTO messages (username, content, role) VALUES (?, ?, ?)', [username, content, role]);
}

export function getLastMessagesForUser(username: string, n: number = 12) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM messages WHERE username = ? ORDER BY TIMESTAMP DESC LIMIT ?', [username, n], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }) as Promise<Message[]>;
}

export function getLastNMessages(n: number = 12) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM messages ORDER BY TIMESTAMP DESC LIMIT ?', [n], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    }) as Promise<Message[]>;
}