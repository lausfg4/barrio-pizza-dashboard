import streamlit as st
import pandas as pd
import numpy as np
from logic import recalculate_alerts, process_alerts

def render_tab_alerts():
    st.markdown("<h2 style='text-align: center; color: var(--primary-color, #E53935);'>🍕 Panel de Resumen y Alertas</h2>", unsafe_allow_html=True)
    st.markdown(
        "<p style='text-align: center; font-size: 1.1rem; opacity: 0.8;'>Visualiza alertas críticas de abastecimiento y corrige las órdenes en tiempo real para optimizar la compra de insumos.</p>",
        unsafe_allow_html=True
    )
    
    # Inicialización del estado de sesión si no existe
    if "df_alertas" not in st.session_state:
        with st.spinner("Procesando datos y alertas iniciales..."):
            st.session_state.df_alertas = process_alerts("datos")
            
    # Filtros en columnas para organizar el dashboard sin saturar la barra lateral
    st.markdown("### 🔍 Filtros de Visualización")
    sucursales_disp = sorted(st.session_state.df_alertas["sucursal"].unique())
    alertas_disp = ["Riesgo de Quiebre", "Sobre-pedido", "Insumo Olvidado", "Correcto"]
    
    col_f1, col_f2, col_f3 = st.columns([2, 2, 1])
    with col_f1:
        selected_sucursales = st.multiselect(
            "Sucursales:",
            options=sucursales_disp,
            default=sucursales_disp,
            help="Selecciona qué sucursales mostrar en el dashboard."
        )
    with col_f2:
        selected_alertas = st.multiselect(
            "Tipos de Alerta:",
            options=alertas_disp,
            default=alertas_disp,
            help="Filtra por el tipo de alerta de abastecimiento."
        )
    with col_f3:
        st.write("")  # Espaciador
        st.write("")  # Espaciador
        if st.button("Restablecer Valores 🔄", use_container_width=True, help="Vuelve a cargar los datos originales de las órdenes de compra."):
            st.session_state.df_alertas = process_alerts("datos")
            st.toast("Órdenes restablecidas a sus valores originales.", icon="🔄")
            st.rerun()

    # Si no hay filtros seleccionados, mostramos una advertencia
    if not selected_sucursales or not selected_alertas:
        st.warning("⚠️ Selecciona al menos una Sucursal y un Tipo de Alerta para visualizar las métricas y la tabla.")
        return

    # Filtrar datos de la sesión
    df_filtered = st.session_state.df_alertas[
        (st.session_state.df_alertas["sucursal"].isin(selected_sucursales)) &
        (st.session_state.df_alertas["alerta_tipo"].isin(selected_alertas))
    ]

    # Calcular Métricas (KPI Cards)
    tot_sucursales = df_filtered["sucursal"].nunique()
    quiebres = df_filtered[df_filtered["alerta_tipo"] == "Riesgo de Quiebre"].shape[0]
    sobrepedidos = df_filtered[df_filtered["alerta_tipo"] == "Sobre-pedido"].shape[0]
    olvidados = df_filtered[df_filtered["alerta_tipo"] == "Insumo Olvidado"].shape[0]

    # Renderizar KPI Cards con CSS Premium (adaptable a Light/Dark Mode)
    st.markdown(f"""
    <style>
    .kpi-container {{
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 25px;
        margin-top: 15px;
    }}
    .kpi-card {{
        background-color: var(--secondary-background-color, #f0f2f6);
        border-radius: 10px;
        padding: 15px 20px;
        border-left: 6px solid #ccc;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        transition: transform 0.2s, box-shadow 0.2s;
    }}
    .kpi-card:hover {{
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
    }}
    .kpi-card.sucursales {{ border-left-color: #9c27b0; }}
    .kpi-card.quiebres {{ border-left-color: #dc3545; }}
    .kpi-card.sobrepedidos {{ border-left-color: #ffc107; }}
    .kpi-card.olvidados {{ border-left-color: #0d6efd; }}
    
    .kpi-label {{
        font-size: 0.85rem;
        color: var(--text-color, #31333F);
        opacity: 0.8;
        font-weight: 600;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }}
    .kpi-value {{
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--text-color, #31333F);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }}
    .kpi-icon {{
        font-size: 2rem;
    }}
    </style>
    <div class="kpi-container">
        <div class="kpi-card sucursales">
            <div class="kpi-label">Sucursales Filtradas</div>
            <div class="kpi-value">
                <span>{tot_sucursales}</span>
                <span class="kpi-icon">🏢</span>
            </div>
        </div>
        <div class="kpi-card quiebres">
            <div class="kpi-label">Riesgo de Quiebre</div>
            <div class="kpi-value">
                <span>{quiebres}</span>
                <span class="kpi-icon">🔴</span>
            </div>
        </div>
        <div class="kpi-card sobrepedidos">
            <div class="kpi-label">Sobre-pedidos</div>
            <div class="kpi-value">
                <span>{sobrepedidos}</span>
                <span class="kpi-icon">🟡</span>
            </div>
        </div>
        <div class="kpi-card olvidados">
            <div class="kpi-label">Insumos Olvidados</div>
            <div class="kpi-value">
                <span>{olvidados}</span>
                <span class="kpi-icon">🔵</span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Contenedor para el editor interactivo de órdenes
    st.markdown("### ✏️ Corrección de Órdenes en Tiempo Real")
    st.markdown(
        "Modifica el valor en la columna **'Cantidad Pedida (Formatos)'** para los insumos en riesgo. Las alertas se recalcularán de inmediato."
    )
    
    display_cols = [
        "alerta_icono", "sucursal", "nombre", "es_perecedero", 
        "proyeccion", "stock_actual_unidad_base", "necesidad_real", 
        "cantidad_formatos", "formato_compra", "pedido_unidad_base", "alerta_mensaje"
    ]
    
    column_config = {
        "alerta_icono": st.column_config.TextColumn("Alerta", width="small", help="Estado de alerta"),
        "sucursal": st.column_config.TextColumn("Sucursal", disabled=True),
        "nombre": st.column_config.TextColumn("Ingrediente", disabled=True),
        "es_perecedero": st.column_config.TextColumn("Perecedero", disabled=True),
        "proyeccion": st.column_config.NumberColumn("Proyección (Unidad)", format="%.2f", disabled=True),
        "stock_actual_unidad_base": st.column_config.NumberColumn("Stock", format="%.2f", disabled=True),
        "necesidad_real": st.column_config.NumberColumn("Necesidad Real", format="%.2f", disabled=True, help="Proyección de consumo - Stock actual"),
        "cantidad_formatos": st.column_config.NumberColumn("Cantidad Pedida (Formatos)", min_value=0.0, step=1.0, format="%.0f"),
        "formato_compra": st.column_config.TextColumn("Formato Compra", disabled=True),
        "pedido_unidad_base": st.column_config.NumberColumn("Pedido (Unidades)", format="%.2f", disabled=True),
        "alerta_mensaje": st.column_config.TextColumn("Detalle de Alerta", disabled=True, width="large"),
    }
    
    df_to_edit = df_filtered[display_cols].copy()
    
    df_edited_filtered = st.data_editor(
        df_to_edit,
        column_config=column_config,
        hide_index=True,
        use_container_width=True,
        key="alerts_editor"
    )
    
    # Si detectamos que el usuario cambió los formatos de pedido
    if not df_edited_filtered["cantidad_formatos"].equals(df_filtered["cantidad_formatos"]):
        # Actualizamos en el session state los renglones editados
        st.session_state.df_alertas.loc[df_edited_filtered.index, "cantidad_formatos"] = df_edited_filtered["cantidad_formatos"]
        
        # Recalculamos las alertas globales utilizando la lógica modificada
        st.session_state.df_alertas = recalculate_alerts(st.session_state.df_alertas)
        st.toast("¡Pedido modificado y alertas actualizadas!", icon="✅")
        st.rerun()
