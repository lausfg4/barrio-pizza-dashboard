import streamlit as st
import base64
from components.tab_alerts import render_tab_alerts
from components.tab_analytics import render_tab_analytics
from components.tab_suppliers import render_tab_suppliers
from components.tab_chat import render_tab_chat

# Configuración de página con título e ícono
st.set_page_config(
    page_title="Barrio Pizza - Control de Órdenes",
    page_icon="🍕",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Función para convertir una imagen local a Base64 y usarla en HTML
def get_image_base64(path):
    try:
        with open(path, "rb") as f:
            data = f.read()
        return "data:image/png;base64," + base64.b64encode(data).decode()
    except Exception:
        return ""

logo_base64 = get_image_base64("logo.png")

# Inyección de CSS personalizado para emular fielmente el diseño de Lau
st.markdown(f"""
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

/* Ocultar elementos nativos innecesarios pero mantener el stHeader transparente para que el botón del sidebar sea visible */
#MainMenu {{visibility: hidden;}}
footer {{visibility: hidden;}}
[data-testid="stHeader"] {{
    background-color: transparent !important;
    box-shadow: none !important;
}}
[data-testid="stHeader"] * {{
    color: #B71C1C !important;
    fill: #B71C1C !important;
}}
[data-testid="stToolbar"] {{visibility: hidden;}}

/* Botón flotante para expandir el sidebar (Asegura visibilidad y clicabilidad de la flecha) */
button[data-testid*="SidebarCollapse"],
div[data-testid="collapsedSidebarHashes"] button {{
    display: flex !important;
    visibility: visible !important;
    opacity: 1 !important;
    background-color: #B71C1C !important;
    color: #FFFFFF !important;
    border-radius: 50% !important;
    padding: 6px !important;
    position: fixed !important;
    top: 12px !important;
    left: 15px !important;
    z-index: 999999 !important;
    box-shadow: 0 4px 12px rgba(183, 28, 28, 0.4) !important;
    width: 38px !important;
    height: 38px !important;
    align-items: center !important;
    justify-content: center !important;
    border: 1px solid #B71C1C !important;
}}

/* Pintar la flecha interna de color blanco para contraste */
button[data-testid*="SidebarCollapse"] svg,
div[data-testid="collapsedSidebarHashes"] button svg {{
    fill: #FFFFFF !important;
    color: #FFFFFF !important;
}}

/* Ajustar paddings de la pantalla principal */
.block-container {{
    padding-top: 1.5rem !important;
    padding-bottom: 2rem !important;
    padding-left: 2.5rem !important;
    padding-right: 2.5rem !important;
    max-width: 100% !important;
}}

/* Fuente Global y Fondo de la App */
html, body, [class*="css"], .stApp {{
    font-family: 'Plus Jakarta Sans', sans-serif !important;
    background-color: #FBF9F6 !important; /* Gris/crema neutro suave */
}}

/* Barra Lateral (Sidebar) Blanco Limpio */
[data-testid="stSidebar"] {{
    background-color: #FFFFFF !important;
    border-right: 1px solid #EAEAEA !important;
}}

[data-testid="stSidebar"] * {{
    color: #2D2D2D !important;
}}

/* Ocultar el círculo nativo del radio button en el sidebar */
[data-testid="stSidebar"] label[data-baseweb="radio"] > div:first-of-type,
[data-testid="stSidebar"] div[data-testid="stRadio"] label > div:first-of-type {{
    display: none !important;
}}

/* Eliminar márgenes del texto de radio en el sidebar */
[data-testid="stSidebar"] label[data-baseweb="radio"] > div:nth-of-type(2),
[data-testid="stSidebar"] div[data-testid="stRadio"] label > div:nth-of-type(2) {{
    margin-left: 0px !important;
    padding-left: 0px !important;
}}

/* Ocultar el label del widget de radio en el sidebar */
[data-testid="stSidebar"] div[data-testid="stWidgetLabel"] {{
    display: none !important;
}}

/* Ajustar los items de radio del menú lateral */
[data-testid="stSidebar"] label[data-baseweb="radio"],
[data-testid="stSidebar"] div[data-testid="stRadio"] label {{
    padding: 12px 18px !important;
    border-radius: 8px !important; 
    margin-bottom: 6px !important;
    transition: all 0.2s ease-in-out !important;
    color: #4A5568 !important;
    font-weight: 600 !important;
    border: none !important;
    display: block !important;
    background-color: transparent !important;
    border-right: 4px solid transparent !important;
}}

/* Hover en items del menú lateral */
[data-testid="stSidebar"] label[data-baseweb="radio"]:hover,
[data-testid="stSidebar"] div[data-testid="stRadio"] label:hover {{
    background-color: rgba(183, 28, 28, 0.04) !important;
    color: #B71C1C !important;
}}

/* Opción activa en el menú lateral */
[data-testid="stSidebar"] label[data-checked="true"],
[data-testid="stSidebar"] div[data-testid="stRadio"] label[data-checked="true"] {{
    background-color: #FDE8E8 !important; /* Fondo rosa suave */
    color: #B71C1C !important; /* Texto rojo vino */
    border-right: 4px solid #B71C1C !important; /* Barra de acento roja a la derecha */
    font-weight: 700 !important;
}}

/* Forzar que el texto seleccionado sea rojo vino */
[data-testid="stSidebar"] label[data-checked="true"] div[data-testid="stMarkdownContainer"] p {{
    color: #B71C1C !important;
}}

/* Estilos para el radio de la página principal (Píldoras horizontales de alerta) */
div[data-testid="stAppViewBlockContainer"] div[data-testid="stRadio"] div[role="radiogroup"] {{
    display: flex !important;
    flex-direction: row !important;
    gap: 10px !important;
}}

div[data-testid="stAppViewBlockContainer"] div[data-testid="stRadio"] div[role="radiogroup"] label {{
    border: 1px solid #E2E8F0 !important;
    border-radius: 20px !important;
    padding: 6px 16px !important;
    background-color: #FFFFFF !important;
    color: #718096 !important;
    font-weight: 600 !important;
    transition: all 0.2s ease-in-out !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    border-right: 1px solid #E2E8F0 !important; /* Restablecer borde derecho */
}}

/* Ocultar círculo nativo en la página principal */
div[data-testid="stAppViewBlockContainer"] div[data-testid="stRadio"] div[role="radiogroup"] label > div:first-of-type {{
    display: none !important;
}}

/* Eliminar espaciados del texto de radio en la página principal */
div[data-testid="stAppViewBlockContainer"] div[data-testid="stRadio"] div[role="radiogroup"] label > div:nth-of-type(2) {{
    margin-left: 0px !important;
    padding-left: 0px !important;
}}

/* Hover en píldoras */
div[data-testid="stAppViewBlockContainer"] div[data-testid="stRadio"] div[role="radiogroup"] label:hover {{
    background-color: #F8F9FA !important;
    border-color: #CBD5E1 !important;
}}

/* Selección activa en píldoras */
div[data-testid="stAppViewBlockContainer"] div[data-testid="stRadio"] div[role="radiogroup"] label[data-checked="true"] {{
    border-color: #B71C1C !important;
    background-color: rgba(183, 28, 28, 0.05) !important;
    color: #B71C1C !important;
}}

div[data-testid="stAppViewBlockContainer"] div[data-testid="stRadio"] div[role="radiogroup"] label[data-checked="true"] * {{
    color: #B71C1C !important;
}}

/* Contenedor principal de tarjetas con bordes redondeados suavemente */
div[data-testid="stContainer"] {{
    background-color: #FFFFFF !important;
    border-radius: 16px !important;
    padding: 24px !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02) !important;
    border: 1px solid #EAEAEA !important;
    margin-bottom: 20px !important;
}}

/* Forzar fondos blancos y bordes estéticos en entradas de texto y multiselects */
div[data-baseweb="select"], div[data-testid="stTextInput"] input {{
    background-color: #FFFFFF !important;
    border-radius: 8px !important;
    border: 1px solid #E2E8F0 !important;
    color: #2D2D2D !important;
}}

div[data-baseweb="select"] * {{
    color: #2D2D2D !important;
}}

/* Redondear visualizadores de dataframes */
div[data-testid="stDataFrame"] {{
    border-radius: 12px !important;
    overflow: hidden;
    border: 1px solid #EAEAEA !important;
    background-color: #FFFFFF !important;
}}

/* Botones principales en color Rojo Vino (#B71C1C) */
div.stButton > button, div.stDownloadButton > button {{
    background-color: #B71C1C !important;
    color: #FFFFFF !important;
    border-radius: 20px !important; /* Botón píldora */
    border: 1px solid #B71C1C !important;
    padding: 10px 24px !important;
    font-size: 0.9rem !important;
    font-weight: 600 !important;
    transition: all 0.2s ease-in-out !important;
    box-shadow: 0 2px 6px rgba(183, 28, 28, 0.15) !important;
}}

div.stButton > button:hover, div.stDownloadButton > button:hover {{
    background-color: #9A1515 !important;
    border-color: #9A1515 !important;
    color: #FFFFFF !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(183, 28, 28, 0.3) !important;
}}

div.stButton > button:active, div.stDownloadButton > button:active {{
    transform: translateY(1px);
}}

/* Rediseño de st.expander estilo Lau */
div[data-testid="stExpander"] {{
    background-color: #FFFFFF !important;
    border-radius: 16px !important;
    border: 1px solid #EAEAEA !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.01) !important;
    margin-bottom: 15px !important;
    overflow: hidden;
}}

.streamlit-expanderHeader {{
    background-color: #FFFFFF !important;
    font-weight: 600 !important;
    font-size: 1.05rem !important;
    color: #2D2D2D !important;
    border-bottom: 1px solid transparent !important;
    padding: 15px 20px !important;
}}

.streamlit-expanderHeader:hover {{
    color: #B71C1C !important;
}}

/* Rediseño de burbujas del Chat */
div[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-assistant"]) {{
    background-color: #FFFFFF !important;
    border-radius: 16px !important;
    border: 1px solid #EAEAEA !important;
    border-left: 5px solid #B71C1C !important;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.01) !important;
    padding: 16px !important;
    margin-bottom: 12px !important;
}}

div[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) {{
    background-color: #B71C1C !important;
    color: #FFFFFF !important;
    border: 1px solid #B71C1C !important;
    border-radius: 16px !important;
    box-shadow: 0 4px 12px rgba(183, 28, 28, 0.1) !important;
    padding: 16px !important;
    margin-bottom: 12px !important;
}}

div[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) * {{
    color: #FFFFFF !important;
}}

/* Avatar del asistente en color rojo vino con icono blanco */
div[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-assistant"]) div[data-testid="stChatMessageAvatar"] {{
    background-color: #B71C1C !important;
    border: 1px solid #B71C1C !important;
}}
div[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-assistant"]) div[data-testid="stChatMessageAvatar"] svg {{
    fill: #FFFFFF !important;
    color: #FFFFFF !important;
}}

/* Avatar del usuario en color rosa suave con icono rojo vino */
div[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) div[data-testid="stChatMessageAvatar"] {{
    background-color: #FDE8E8 !important;
    border: 1px solid #FDE8E8 !important;
}}
div[data-testid="stChatMessage"]:has([data-testid="chatAvatarIcon-user"]) div[data-testid="stChatMessageAvatar"] svg {{
    fill: #B71C1C !important;
    color: #B71C1C !important;
}}

/* Caja de entrada del chat circular */
div[data-testid="stChatInput"] {{
    border-radius: 30px !important;
    border: 1px solid #EAEAEA !important;
    background-color: #FFFFFF !important;
    padding: 5px 15px !important;
}}

/* Botón de envío de chat circular rojo */
div[data-testid="stChatInput"] button {{
    background-color: #B71C1C !important;
    color: #FFFFFF !important;
    border-radius: 50% !important;
    border: none !important;
    width: 36px !important;
    height: 36px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}}

div[data-testid="stChatInput"] button:hover {{
    background-color: #9A1515 !important;
}}
</style>
""", unsafe_allow_html=True)

# Encabezado en el Sidebar con el Logo circular de Barrio Pizza y título alineados en rojo vino (#B71C1C)
st.sidebar.markdown(f"""
<div style='display: flex; align-items: center; gap: 12px; margin-top: 10px; margin-bottom: 25px; padding-left: 10px;'>
    <img src='{logo_base64}' style='width: 48px; height: 48px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.06); object-fit: cover;'>
    <div>
        <h3 style='margin: 0; color: #B71C1C; font-size: 1.25rem; font-weight: 800; line-height: 1.1; font-family: "Plus Jakarta Sans", sans-serif;'>Barrio Pizza</h3>
        <p style='margin: 2px 0 0 0; color: #718096; font-size: 0.8rem; font-weight: 600;'>Control de Órdenes</p>
    </div>
</div>
""", unsafe_allow_html=True)

# Opciones de Navegación Lateral (Menú estilo mockup)
menu_option = st.sidebar.radio(
    "Navegación",
    options=[
        "📋 Resumen & Alertas", 
        "📈 Análisis de Consumo", 
        "📦 Pedidos por Proveedor",
        "💬 Asistente IA"
    ]
)

# Cabecera superior del área de contenido principal (Barra de herramientas estilo Lau)
col_h1, col_h2, col_h3 = st.columns([5, 4, 3])
with col_h1:
    st.markdown(
        "<h4 style='margin-top: 12px; color: #2D2D2D; font-weight: 800;'>Barrio Pizza — Control de Órdenes</h4>", 
        unsafe_allow_html=True
    )
with col_h2:
    st.text_input("Buscar", placeholder="🔍 Buscar insumos...", label_visibility="collapsed", key="global_search")
with col_h3:
    col_sub_btn, col_sub_icons = st.columns([2, 1])
    with col_sub_btn:
        if st.button("Re-Calcular Alertas", key="top_recalculate", use_container_width=True):
            from logic import process_alerts
            st.session_state.df_alertas = process_alerts("datos")
            st.toast("Órdenes recalculadas exitosamente.", icon="🔄")
            st.rerun()
    with col_sub_icons:
        st.markdown(
            "<div style='display: flex; align-items: center; justify-content: flex-end; gap: 15px; margin-top: 6px; font-size: 1.3rem; color: #718096;'>\n"
            "<span style='cursor:pointer;'>🔔</span>\n"
            "<span style='cursor:pointer; background-color: #E2E8F0; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; font-weight: bold; color: #4A5568;'>L</span>\n"
            "</div>",
            unsafe_allow_html=True
        )

st.markdown("<hr style='margin: 10px 0 25px 0; border-top: 1px solid rgba(0,0,0,0.06);'>", unsafe_allow_html=True)

# Renderizar la vista correspondiente a la opción seleccionada
if menu_option == "📋 Resumen & Alertas":
    render_tab_alerts()
elif menu_option == "📈 Análisis de Consumo":
    render_tab_analytics()
elif menu_option == "📦 Pedidos por Proveedor":
    render_tab_suppliers()
elif menu_option == "💬 Asistente IA":
    render_tab_chat()

# Agregar Ajustes y Soporte al final de la barra lateral
st.sidebar.markdown("""
<div style='margin-top: 120px; padding-left: 10px; border-top: 1px solid rgba(0,0,0,0.04); padding-top: 15px;'>
    <div style='display: flex; align-items: center; gap: 10px; color: #718096; font-weight: 600; margin-bottom: 15px; font-size: 0.9rem; cursor: pointer;'>
        <span style='font-size: 1.1rem;'>⚙️</span> Ajustes
    </div>
    <div style='display: flex; align-items: center; gap: 10px; color: #718096; font-weight: 600; font-size: 0.9rem; cursor: pointer;'>
        <span style='font-size: 1.1rem;'>❓</span> Soporte
    </div>
</div>
""", unsafe_allow_html=True)