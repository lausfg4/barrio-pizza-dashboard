import streamlit as st
import pandas as pd
import numpy as np
from logic import recalculate_alerts, process_alerts

def render_tab_alerts():
    # Títulos estilizados
    st.markdown("<h2 style='color: #2D2D2D; font-weight: 800; margin-bottom: 2px;'>Resumen & Alertas</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #718096; font-size: 1.05rem; margin-bottom: 25px;'>Semana 7 — Revisión Automática de Insumos</p>", unsafe_allow_html=True)
    
    # Inicialización del estado de sesión si no existe
    if "df_alertas" not in st.session_state:
        with st.spinner("Procesando datos y alertas iniciales..."):
            st.session_state.df_alertas = process_alerts("datos")
            
    df_alertas = st.session_state.df_alertas

    # Calcular estadísticas globales para las tarjetas KPI
    quiebres_global = df_alertas[df_alertas["alerta_tipo"] == "Riesgo de Quiebre"].shape[0]
    sobrepedidos_global = df_alertas[df_alertas["alerta_tipo"] == "Sobre-pedido"].shape[0]
    olvidados_global = df_alertas[df_alertas["alerta_tipo"] == "Insumo Olvidado"].shape[0]
    tot_sucursales_global = df_alertas["sucursal"].nunique()

    # Renderizar KPI Cards con contorno fino estilo Lau
    st.markdown(f"""
    <style>
    .kpi-grid {{
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 30px;
    }}
    .kpi-box {{
        background-color: #FFFFFF;
        border-radius: 16px;
        padding: 20px 24px;
        border: 1px solid #EAEAEA;
        box-shadow: 0 4px 10px rgba(0,0,0,0.01);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        height: 125px;
    }}
    .kpi-header {{
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }}
    .kpi-title-sucursales {{ color: #718096; }}
    .kpi-title-quiebres {{ color: #B71C1C; }}
    .kpi-title-sobrepedidos {{ color: #DD6B20; }}
    .kpi-title-olvidados {{ color: #3182CE; }}
    
    .kpi-body {{
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-top: 15px;
    }}
    .kpi-num {{
        font-size: 2rem;
        font-weight: 800;
        color: #2D2D2D;
        line-height: 1;
    }}
    .kpi-badge {{
        font-size: 0.75rem;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 20px;
    }}
    .kpi-badge-green {{
        background-color: #E6FFFA;
        color: #319795;
    }}
    .kpi-badge-red-link {{
        color: #B71C1C;
        font-weight: 600;
        font-size: 0.8rem;
        text-decoration: underline;
        cursor: pointer;
    }}
    </style>
    
    <div class="kpi-grid">
        <div class="kpi-box">
            <div class="kpi-header kpi-title-sucursales">
                <span>Total Sucursales</span>
                <span>🏢</span>
            </div>
            <div class="kpi-body">
                <span class="kpi-num">{tot_sucursales_global} Active</span>
                <span class="kpi-badge kpi-badge-green">↗ 100%</span>
            </div>
        </div>
        <div class="kpi-box">
            <div class="kpi-header kpi-title-quiebres">
                <span>🔴 Stock Crítico</span>
                <span>⚠️</span>
            </div>
            <div class="kpi-body">
                <span class="kpi-num">{quiebres_global} items</span>
                <span class="kpi-badge-red-link">Ver Detalle</span>
            </div>
        </div>
        <div class="kpi-box">
            <div class="kpi-header kpi-title-sobrepedidos">
                <span>🟡 Sobre-pedidos</span>
                <span>📦</span>
            </div>
            <div class="kpi-body">
                <span class="kpi-num">{sobrepedidos_global} items</span>
                <span style='color: #718096; font-size: 0.8rem; font-weight: 500;'>Analizado</span>
            </div>
        </div>
        <div class="kpi-box">
            <div class="kpi-header kpi-title-olvidados">
                <span>🔵 Insumos Olvidados</span>
                <span>📋</span>
            </div>
            <div class="kpi-body">
                <span class="kpi-num">{olvidados_global} items</span>
                <span style='color: #718096; font-size: 0.8rem; font-weight: 500;'>Pendiente</span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Contenedor de Filtros (Estilo Lau)
    st.markdown("<h4 style='color: #2D2D2D; font-weight: 700; margin-bottom: 15px;'>Filtros de Búsqueda</h4>", unsafe_allow_html=True)
    sucursales_disp = sorted(df_alertas["sucursal"].unique())
    
    col_filter1, col_filter2 = st.columns([1, 2])
    with col_filter1:
        # Selector de Sucursales
        selected_sucursal_opt = st.selectbox(
            "Sucursales:",
            options=["Todas las Sucursales"] + sucursales_disp,
            index=0,
            label_visibility="collapsed"
        )
    with col_filter2:
        # Selector de Píldoras de Alerta
        selected_pill = st.radio(
            "Filtro de Alerta:",
            options=["Todos", "🔴 Crítico", "🟡 Exceso", "🔵 Olvido"],
            horizontal=True,
            label_visibility="collapsed"
        )

    # Filtrar según la Sucursal seleccionada
    if selected_sucursal_opt == "Todas las Sucursales":
        df_filtered = df_alertas.copy()
    else:
        df_filtered = df_alertas[df_alertas["sucursal"] == selected_sucursal_opt].copy()

    # Filtrar según la Píldora de Alerta seleccionada
    if selected_pill == "🔴 Crítico":
        df_filtered = df_filtered[df_filtered["alerta_tipo"] == "Riesgo de Quiebre"]
    elif selected_pill == "🟡 Exceso":
        df_filtered = df_filtered[df_filtered["alerta_tipo"] == "Sobre-pedido"]
    elif selected_pill == "🔵 Olvido":
        df_filtered = df_filtered[df_filtered["alerta_tipo"] == "Insumo Olvidado"]

    # Mostrar la tabla interactiva
    st.markdown("<br>", unsafe_allow_html=True)
    
    # Preparar el dataframe mapeando los nombres de columna y los textos de estado
    df_to_display = df_filtered.copy()
    
    # Mapear estados a textos visuales elegantes
    df_to_display["Estado"] = df_to_display["alerta_tipo"].map({
        "Riesgo de Quiebre": "CRÍTICO",
        "Sobre-pedido": "EXCESO",
        "Insumo Olvidado": "OLVIDO",
        "Correcto": "OK"
    })

    # Renombrar columnas para la visualización exacta de la tabla de Lau
    df_to_display = df_to_display[[
        "sucursal", "nombre", "stock_actual_unidad_base", "proyeccion", 
        "necesidad_real", "cantidad_formatos", "Estado", "alerta_mensaje"
    ]].rename(columns={
        "sucursal": "Sucursal",
        "nombre": "Ingrediente",
        "stock_actual_unidad_base": "Stock Actual",
        "proyeccion": "Proyección",
        "necesidad_real": "Nec. Real",
        "cantidad_formatos": "Cant. Pedido (Formatos)",
        "alerta_mensaje": "Acción"
    })

    column_config = {
        "Sucursal": st.column_config.TextColumn("Sucursal", disabled=True),
        "Ingrediente": st.column_config.TextColumn("Ingrediente", disabled=True),
        "Stock Actual": st.column_config.NumberColumn("Stock Actual", format="%.2f", disabled=True),
        "Proyección": st.column_config.NumberColumn("Proyección", format="%.2f", disabled=True),
        "Nec. Real": st.column_config.NumberColumn("Nec. Real", format="%.2f", disabled=True),
        "Cant. Pedido (Formatos)": st.column_config.NumberColumn("Cant. Pedido", min_value=0.0, step=1.0, format="%.0f"),
        "Estado": st.column_config.TextColumn("Estado", disabled=True),
        "Acción": st.column_config.TextColumn("Acción Recomendada", disabled=True, width="large")
    }

    df_edited = st.data_editor(
        df_to_display,
        column_config=column_config,
        hide_index=True,
        use_container_width=True,
        key="alerts_editor"
    )

    # Si detectamos que el usuario cambió las cantidades pedidas
    if not df_edited["Cant. Pedido (Formatos)"].equals(df_to_display["Cant. Pedido (Formatos)"]):
        # Mapear los cambios de regreso al DataFrame de sesión de Streamlit usando el índice de fila original
        for i, row in df_edited.iterrows():
            suc_val = row["Sucursal"]
            ing_val = row["Ingrediente"]
            new_val = row["Cant. Pedido (Formatos)"]
            
            # Buscar la fila correspondiente en el df global de sesión
            idx = df_alertas[
                (df_alertas["sucursal"] == suc_val) & 
                (df_alertas["nombre"] == ing_val)
            ].index
            
            if not idx.empty:
                st.session_state.df_alertas.loc[idx[0], "cantidad_formatos"] = new_val

        # Recalcular las alertas globales utilizando la lógica de negocio
        st.session_state.df_alertas = recalculate_alerts(st.session_state.df_alertas)
        st.toast("¡Pedido modificado y alertas recalculadas en tiempo real!", icon="✅")
        st.rerun()
