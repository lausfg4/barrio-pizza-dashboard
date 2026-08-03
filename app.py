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

# Inyección de CSS personalizado para modernizar la interfaz
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

/* Fuente Global y Fondo de la App */
html, body, [class*="css"], .stApp {
    font-family: 'Outfit', sans-serif !important;
    background-color: #F8F9FA !important; /* Gris suave de fondo */
}

/* Barra Lateral Oscura (Sidebar) */
[data-testid="stSidebar"] {
    background-color: #0E1117 !important; /* Negro de alta calidad */
}

[data-testid="stSidebar"] * {
    color: #FFFFFF !important;
}

/* Ocultar el círculo del botón de radio en el sidebar */
[data-testid="stSidebar"] label[data-baseweb="radio"] > div:first-of-type {
    display: none !important;
}

/* Forzar la alineación y eliminar márgenes en el texto después de ocultar el círculo */
[data-testid="stSidebar"] label[data-baseweb="radio"] > div:nth-of-type(2) {
    margin-left: 0px !important;
    padding-left: 0px !important;
}

/* Ocultar texto duplicado en el widget del sidebar */
[data-testid="stSidebar"] div[data-testid="stWidgetLabel"] {
    display: none !important;
}

/* Ajustar las opciones del menú lateral como botones de navegación */
[data-testid="stSidebar"] label[data-baseweb="radio"] {
    padding: 12px 18px !important;
    border-radius: 12px !important;
    margin-bottom: 8px !important;
    transition: all 0.2s ease-in-out !important;
    color: #A0A5B1 !important;
    font-weight: 500 !important;
    border: 1px solid transparent !important;
    display: block !important;
}

[data-testid="stSidebar"] label[data-baseweb="radio"]:hover {
    background-color: rgba(255, 255, 255, 0.08) !important;
    color: #FFFFFF !important;
    border-color: rgba(255, 255, 255, 0.1) !important;
}

/* Opción activa en el menú lateral */
[data-testid="stSidebar"] label[data-checked="true"] {
    background-color: #E53935 !important; /* Rojo Barrio Pizza */
    color: #FFFFFF !important;
    font-weight: 600 !important;
    box-shadow: 0 4px 12px rgba(229, 57, 53, 0.3) !important;
}

/* Eliminar espaciados de markdown en botones de radio */
[data-testid="stSidebar"] label[data-baseweb="radio"] div[data-testid="stMarkdownContainer"] {
    margin-left: 0px !important;
    padding-left: 0px !important;
}

/* Título de Marca y Encabezados */
.main-title {
    text-align: center;
    color: #0F172A;
    font-size: 2.6rem;
    font-weight: 800;
    margin-bottom: 0px;
    letter-spacing: -0.5px;
}

.subtitle {
    text-align: center;
    color: #64748B;
    font-size: 1.1rem;
    font-weight: 500;
    margin-top: 5px;
    margin-bottom: 25px;
}

/* Estilo para las Tarjetas Blancas (st.container con borde) */
div[data-testid="stContainer"] {
    background-color: #FFFFFF !important;
    border-radius: 16px !important;
    padding: 24px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03) !important;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
    margin-bottom: 20px !important;
}

/* Redondear visualizadores de dataframes */
div[data-testid="stDataFrame"] {
    border-radius: 12px !important;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
}

/* Estilización de Botones a Estilo Cápsula Negra Sólida */
div.stButton > button, div.stDownloadButton > button {
    background-color: #000000 !important;
    color: #FFFFFF !important;
    border-radius: 20px !important;
    border: 1px solid #000000 !important;
    padding: 10px 24px !important;
    font-size: 0.95rem !important;
    font-weight: 600 !important;
    transition: all 0.2s ease-in-out !important;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05) !important;
}

div.stButton > button:hover, div.stDownloadButton > button:hover {
    background-color: #1E293B !important;
    border-color: #1E293B !important;
    color: #FFFFFF !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

div.stButton > button:active, div.stDownloadButton > button:active {
    transform: translateY(1px);
}

/* Rediseño de st.expander */
div[data-testid="stExpander"] {
    background-color: #FFFFFF !important;
    border-radius: 16px !important;
    border: 1px solid rgba(0, 0, 0, 0.05) !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03) !important;
    margin-bottom: 15px !important;
    overflow: hidden;
}

.streamlit-expanderHeader {
    background-color: #FFFFFF !important;
    font-weight: 600 !important;
    font-size: 1.05rem !important;
    color: #0F172A !important;
    border-bottom: 1px solid transparent !important;
    padding: 15px 20px !important;
}

.streamlit-expanderHeader:hover {
    color: #E53935 !important;
}
</style>
""", unsafe_allow_html=True)

# Encabezado en el Sidebar con el Logo de Barrio Pizza
st.sidebar.image("logo.png", use_container_width=True)
st.sidebar.markdown(
    "<h3 style='text-align: center; color: white; font-family: \"Outfit\", sans-serif; font-weight: 800; margin-bottom: 25px;'>BARRIO PIZZA</h3>",
    unsafe_allow_html=True
)

# Opciones de Navegación Lateral (Menú estilo mockup)
menu_option = st.sidebar.radio(
    "Navegación",
    options=[
        "📋 Resumen y Alertas", 
        "📈 Proyecciones de Consumo", 
        "📦 Pedidos por Proveedor",
        "💬 Asistente IA"
    ]
)

# Títulos de marca en el área principal
st.markdown("<h1 class='main-title'>BARRIO PIZZA</h1>", unsafe_allow_html=True)
st.markdown("<p class='subtitle'>🍕 Dashboard de Compras y Alertas de Abastecimiento</p>", unsafe_allow_html=True)
st.markdown("---")

# Renderizar la vista correspondiente a la opción seleccionada
if menu_option == "📋 Resumen y Alertas":
    render_tab_alerts()
elif menu_option == "📈 Proyecciones de Consumo":
    render_tab_analytics()
elif menu_option == "📦 Pedidos por Proveedor":
    render_tab_suppliers()
elif menu_option == "💬 Asistente IA":
    render_tab_chat()