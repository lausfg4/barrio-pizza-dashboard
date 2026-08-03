import streamlit as st
from components.tab_alerts import render_tab_alerts
from components.tab_analytics import render_tab_analytics
from components.tab_suppliers import render_tab_suppliers
from components.tab_chat import render_tab_chat

# Configuración de página con título e ícono
st.set_page_config(
    page_title="Barrio Pizza - Control de Órdenes",
    page_icon="🍕",
    layout="wide"
)

# Título principal del Dashboard
st.markdown("<h1 style='text-align: center;'>🍕 Barrio Pizza - Dashboard de Compras</h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align: center; color: gray;'>Sistema Inteligente de Alertas y Optimización de Pedidos para Sucursales</p>", unsafe_allow_html=True)
st.markdown("---")

# Estructura de pestañas para soportar múltiples fases del proyecto
tab_alerts, tab_projections, tab_suppliers, tab_chat = st.tabs([
    "📋 Resumen y Alertas", 
    "📈 Proyecciones de Consumo", 
    "📦 Pedidos por Proveedor",
    "💬 Asistente IA"
])

with tab_alerts:
    render_tab_alerts()
    
with tab_projections:
    render_tab_analytics()
    
with tab_suppliers:
    render_tab_suppliers()
    
with tab_chat:
    render_tab_chat()