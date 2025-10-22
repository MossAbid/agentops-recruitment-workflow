from fastapi import FastAPI
from langgraph.graph import StateGraph, START, END
from langchain_core.runnables import RunnablePassthrough
import agentops, os

agentops.init(api_key=os.getenv("AGENTOPS_API_KEY"))

app = FastAPI(title="Recruitment Agent", version="1.0")

graph = StateGraph(dict)
llm = RunnablePassthrough()

def source_candidate(state):
    return {"message": llm.invoke(f"Analyse candidat {state['profile']}")}

graph.add_node("source_candidate", source_candidate)
graph.add_edge(START, "source_candidate")
graph.add_edge("source_candidate", END)
workflow = graph.compile()

@app.post("/agent")
async def run_agent(state: dict):
    return workflow.invoke(state)
