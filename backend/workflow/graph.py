"""
LangGraph StateGraph Core Engine for Revenue Services.
Provides StateGraph, START, END, conditional routing, and state execution engine.
"""
from typing import Callable, Dict, Any, List, Optional
from backend.workflow.state import RevenueAgentState
from backend.workflow.checkpointer import SQLiteCheckpointer

START = "__start__"
END = "__end__"

class CompiledGraph:
    def __init__(self, nodes: Dict[str, Callable], edges: Dict[str, str],
                 conditional_edges: Dict[str, tuple[Callable, Dict[str, str]]],
                 entry_point: str):
        self.nodes = nodes
        self.edges = edges
        self.conditional_edges = conditional_edges
        self.entry_point = entry_point

    def invoke(self, state: RevenueAgentState, session_id: Optional[str] = None) -> RevenueAgentState:
        """Executes the StateGraph sequentially with conditional branching and checkpointing."""
        current_node_name = self.entry_point
        session = session_id or state.session_id

        while current_node_name and current_node_name != END:
            if current_node_name not in self.nodes:
                state.execution_trace.append(f"error:node_not_found:{current_node_name}")
                break

            # Execute Node
            node_fn = self.nodes[current_node_name]
            state = node_fn(state)
            
            # Save Checkpoint in SQLite
            if session:
                SQLiteCheckpointer.save_checkpoint(session, current_node_name, state)

            # Determine Next Node
            if current_node_name in self.conditional_edges:
                cond_fn, path_map = self.conditional_edges[current_node_name]
                branch_key = cond_fn(state)
                current_node_name = path_map.get(branch_key, END)
            elif current_node_name in self.edges:
                current_node_name = self.edges[current_node_name]
            else:
                current_node_name = END

        return state

class StateGraph:
    def __init__(self, state_schema=RevenueAgentState):
        self.state_schema = state_schema
        self.nodes: Dict[str, Callable] = {}
        self.edges: Dict[str, str] = {}
        self.conditional_edges: Dict[str, tuple[Callable, Dict[str, str]]] = {}
        self.entry_point: str = ""

    def add_node(self, name: str, action: Callable):
        self.nodes[name] = action

    def set_entry_point(self, name: str):
        self.entry_point = name

    def add_edge(self, from_node: str, to_node: str):
        self.edges[from_node] = to_node

    def add_conditional_edges(self, from_node: str, condition: Callable, path_map: Dict[str, str]):
        self.conditional_edges[from_node] = (condition, path_map)

    def compile(self) -> CompiledGraph:
        if not self.entry_point and self.nodes:
            self.entry_point = list(self.nodes.keys())[0]
        return CompiledGraph(
            nodes=self.nodes,
            edges=self.edges,
            conditional_edges=self.conditional_edges,
            entry_point=self.entry_point
        )
