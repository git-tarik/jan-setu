"""
LangGraph Checkpointer (SQLite Persistence).
Stores conversation graph state checkpoints persistently for time-travel, channel handoffs, and drop recovery.
"""
import json
import sqlite3
import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime
from backend.config import DB_PATH
from backend.workflow.state import RevenueAgentState

class SQLiteCheckpointer:
    @staticmethod
    def init_table():
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS agent_checkpoints (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            step_name TEXT NOT NULL,
            checkpoint_json TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
        """)
        conn.commit()
        conn.close()

    @staticmethod
    def save_checkpoint(session_id: str, step_name: str, state: RevenueAgentState) -> str:
        SQLiteCheckpointer.init_table()
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        checkpoint_id = f"chk-{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow().isoformat()
        state_dict = state.to_dict()

        cursor.execute("""
        INSERT INTO agent_checkpoints (id, session_id, step_name, checkpoint_json, timestamp)
        VALUES (?, ?, ?, ?, ?)
        """, (checkpoint_id, session_id, step_name, json.dumps(state_dict), now))
        conn.commit()
        conn.close()
        return checkpoint_id

    @staticmethod
    def get_latest_checkpoint(session_id: str) -> Optional[RevenueAgentState]:
        SQLiteCheckpointer.init_table()
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
        SELECT checkpoint_json FROM agent_checkpoints
        WHERE session_id = ?
        ORDER BY timestamp DESC LIMIT 1
        """, (session_id,))
        row = cursor.fetchone()
        conn.close()

        if not row:
            return None
        data = json.loads(row["checkpoint_json"])
        return RevenueAgentState.from_dict(data)

    @staticmethod
    def get_history(session_id: str) -> List[Dict[str, Any]]:
        SQLiteCheckpointer.init_table()
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("""
        SELECT id, step_name, timestamp FROM agent_checkpoints
        WHERE session_id = ?
        ORDER BY timestamp ASC
        """, (session_id,))
        rows = cursor.fetchall()
        conn.close()
        return [{"id": r["id"], "step_name": r["step_name"], "timestamp": r["timestamp"]} for r in rows]
