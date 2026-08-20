"""
Compiled LangGraph Agentic Workflow for Multilingual Revenue Services.
Builds the DAG of specialized nodes and conditional routing edges.
"""
from backend.workflow.graph import StateGraph, START, END
from backend.workflow.state import RevenueAgentState
from backend.workflow.nodes.guardrail_node import guardrail_node
from backend.workflow.nodes.intent_nlu_node import intent_nlu_node
from backend.workflow.nodes.validation_node import validation_node
from backend.workflow.nodes.document_ocr_node import document_ocr_node
from backend.workflow.nodes.escalation_node import escalation_node
from backend.workflow.nodes.response_node import response_node

def route_after_validation(state: RevenueAgentState) -> str:
    """Conditional routing function after validation node."""
    if not state.validation_passed and state.retry_count >= 3:
        return "escalate"
    return "respond"

def build_revenue_agent_graph():
    """Constructs and compiles the full LangGraph agent workflow."""
    workflow = StateGraph(RevenueAgentState)

    # 1. Add Specialized Agent Nodes
    workflow.add_node("guardrail", guardrail_node)
    workflow.add_node("intent_nlu", intent_nlu_node)
    workflow.add_node("validation", validation_node)
    workflow.add_node("document_ocr", document_ocr_node)
    workflow.add_node("escalation", escalation_node)
    workflow.add_node("response", response_node)

    # 2. Define Entry Point & Directed Edges
    workflow.set_entry_point("guardrail")
    workflow.add_edge("guardrail", "intent_nlu")
    workflow.add_edge("intent_nlu", "validation")

    # 3. Add Conditional Edge for Self-Correction & Escalation
    workflow.add_conditional_edges(
        "validation",
        route_after_validation,
        {
            "escalate": "escalation",
            "respond": "response"
        }
    )

    # 4. Terminate to END
    workflow.add_edge("response", END)
    workflow.add_edge("escalation", END)

    return workflow.compile()

# Singleton compiled graph instance for reuse
revenue_agent_graph = build_revenue_agent_graph()
