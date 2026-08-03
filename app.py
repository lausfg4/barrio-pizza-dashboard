import streamlit as st
from components.tab_alerts import render_tab_alerts
from components.tab_analytics import render_tab_analytics

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
tab_alerts, tab_projections, tab_chat = st.tabs([
    "📋 Resumen y Alertas", 
    "📈 Proyecciones de Consumo", 
    "💬 Asistente IA"
])

with tab_alerts:
    render_tab_alerts()
    
with tab_projections:
    render_tab_analytics()
    
with tab_chat:
    st.subheader("💬 Asistente de Compras Inteligente")
    st.info("Esta pestaña se habilitará en la siguiente fase para chatear con los datos mediante IA.")