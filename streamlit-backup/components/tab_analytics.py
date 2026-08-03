import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from logic import load_data

def render_tab_analytics():
    # Cabecera de Pestaña
    st.markdown("<h2 style='color: #2D2D2D; font-weight: 800; margin-bottom: 2px;'>Análisis de Consumo</h2>", unsafe_allow_html=True)
    st.markdown("<p style='color: #718096; font-size: 1.05rem; margin-bottom: 25px;'>Monitoreo y predicción de inventario crítico.</p>", unsafe_allow_html=True)

    # Asegurar que los datos históricos y catálogo estén en session_state
    if "df_consumo" not in st.session_state or "df_ingredientes" not in st.session_state:
        with st.spinner("Cargando datos históricos de consumo..."):
            try:
                dfs = load_data("datos")
                st.session_state.df_consumo = dfs["consumo"]
                st.session_state.df_ingredientes = dfs["ingredientes"]
            except Exception as e:
                st.error(f"Error al cargar los datos: {e}")
                return

    if "df_alertas" not in st.session_state:
        from logic import process_alerts
        with st.spinner("Cargando alertas de abastecimiento..."):
            st.session_state.df_alertas = process_alerts("datos")

    df_consumo = st.session_state.df_consumo
    df_ing = st.session_state.df_ingredientes
    df_alertas = st.session_state.df_alertas

    # Parámetros de Selección en el área de contenido principal
    st.markdown("<h4 style='color: #2D2D2D; font-weight: 700; margin-bottom: 15px;'>🎯 Parámetros de Análisis</h4>", unsafe_allow_html=True)
    col_sel1, col_sel2 = st.columns(2)
    
    with col_sel1:
        sucursales = sorted(df_consumo["sucursal"].unique())
        selected_sucursal = st.selectbox(
            "Selecciona una Sucursal:",
            options=sucursales,
            key="analytics_sucursal",
            label_visibility="collapsed"
        )
        
    with col_sel2:
        ing_map = dict(zip(df_ing["nombre"], df_ing["ingrediente_id"]))
        sorted_ing_names = sorted(ing_map.keys())
        selected_ing_name = st.selectbox(
            "Selecciona un Insumo / Ingrediente:",
            options=sorted_ing_names,
            key="analytics_ingrediente",
            label_visibility="collapsed"
        )
        selected_ing_id = ing_map[selected_ing_name]

    # Obtener datos para la combinación seleccionada
    df_hist_filtered = df_consumo[
        (df_consumo["sucursal"] == selected_sucursal) & 
        (df_consumo["ingrediente_id"] == selected_ing_id)
    ]
    
    weeks = ["S1", "S2", "S3", "S4", "S5", "S6"]
    hist_dict = dict(zip(df_hist_filtered["semana"], df_hist_filtered["consumo_unidad_base"]))
    hist_values = [hist_dict.get(w, 0.0) for w in weeks]

    df_alert_filtered = df_alertas[
        (df_alertas["sucursal"] == selected_sucursal) & 
        (df_alertas["ingrediente_id"] == selected_ing_id)
    ]
    
    if df_alert_filtered.empty:
        st.warning("⚠️ No se encontraron registros de alerta para la combinación seleccionada.")
        return
        
    row_data = df_alert_filtered.iloc[0]
    proyeccion_val = row_data["proyeccion"]
    stock_val = row_data["stock_actual_unidad_base"]
    necesidad_val = row_data["necesidad_real"]
    unidad = row_data["unidad_base"]

    # Calcular Métricas Superiores dinámicas
    consumo_semanal_promedio = np.mean(hist_values) if hist_values else 0.0
    cobertura_dias = (stock_val / proyeccion_val) * 7 if proyeccion_val > 0 else 99.0
    merma_estimada = max(0.0, stock_val - proyeccion_val) if row_data["es_perecedero"] == "Sí" else 0.0

    if cobertura_dias < 3.0:
        cobertura_status = "Crítico 🔴"
    elif cobertura_dias < 7.0:
        cobertura_status = "Aceptable 🟡"
    else:
        cobertura_status = "Exceso 🔵"

    # Renderizar las 4 tarjetas KPI de Proyecciones estilo Lau
    st.markdown(f"""
    <div class="kpi-grid">
        <div class="kpi-box">
            <div class="kpi-header kpi-title-sucursales">
                <span>Consumo Total Semanal</span>
                <span>⌛</span>
            </div>
            <div class="kpi-body">
                <span class="kpi-num">{consumo_semanal_promedio:.1f} {unidad}</span>
                <span class="kpi-badge kpi-badge-green">↘ 2.4%</span>
            </div>
        </div>
        <div class="kpi-box">
            <div class="kpi-header kpi-title-sucursales">
                <span>Stock Promedio</span>
                <span>💾</span>
            </div>
            <div class="kpi-body">
                <span class="kpi-num">{stock_val:.1f} {unidad}</span>
                <span class="kpi-badge kpi-badge-green" style="background-color: #FFF5F5; color: #B71C1C;">↘ 5.1%</span>
            </div>
        </div>
        <div class="kpi-box">
            <div class="kpi-header kpi-title-quiebres">
                <span>Días de Cobertura</span>
                <span>⚠️</span>
            </div>
            <div class="kpi-body">
                <span class="kpi-num">{cobertura_dias:.1f} Días</span>
                <span class="kpi-badge" style="background-color: #FFF5F5; color: #B71C1C; font-weight: bold;">{cobertura_status}</span>
            </div>
        </div>
        <div class="kpi-box">
            <div class="kpi-header kpi-title-sobrepedidos">
                <span>Desperdicio Estimado</span>
                <span>🗑️</span>
            </div>
            <div class="kpi-body">
                <span class="kpi-num">{merma_estimada:.1f} {unidad}</span>
                <span class="kpi-badge kpi-badge-green">↘ 1.2%</span>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Contenedor para gráficos en 2 columnas
    col_chart_line, col_chart_bar = st.columns([5, 4])

    # 1. Gráfico de líneas (Histórico + Proyección) estilo Lau
    with col_chart_line:
        st.markdown("##### Histórico de Consumo")
        st.markdown(f"<p style='color: #718096; font-size: 0.85rem; margin-top: -8px;'>Tendencia a 6 semanas y predicción ({selected_ing_name})</p>", unsafe_allow_html=True)
        
        fig_line = go.Figure()
        
        # Histórico S1 a S6 (línea negra continua con puntos blancos con borde negro)
        fig_line.add_trace(go.Scatter(
            x=weeks,
            y=hist_values,
            mode="lines+markers",
            name="Consumo Real",
            line=dict(color="#000000", width=4, shape="spline"),
            marker=dict(size=10, color="#FFFFFF", line=dict(color="#000000", width=3)),
            hovertemplate="Semana %{x}<br>Consumo: %{y:.2f} " + unidad + "<extra></extra>"
        ))
        
        # Proyección S6 a S7 (línea punteada roja apuntando a S7)
        fig_line.add_trace(go.Scatter(
            x=["S6", "S7 (Pred)"],
            y=[hist_values[-1], proyeccion_val],
            mode="lines+markers",
            name="Predicción",
            line=dict(color="#B71C1C", width=4, dash="dot"),
            marker=dict(size=12, color="#B71C1C", line=dict(color="#FFFFFF", width=2)),
            hovertemplate="Semana %{x}<br>Proyección: %{y:.2f} " + unidad + "<extra></extra>"
        ))
        
        fig_line.update_layout(
            margin=dict(l=10, r=10, t=10, b=10),
            height=340,
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            xaxis=dict(showline=True, showgrid=True, gridcolor="#EAEAEA", linecolor="#EAEAEA"),
            yaxis=dict(showgrid=True, gridcolor="#EAEAEA", linecolor="#EAEAEA", zeroline=True, zerolinecolor="#EAEAEA"),
            hovermode="x unified"
        )
        
        st.plotly_chart(fig_line, use_container_width=True)

    # 2. Gráfico de barras (Inventario vs Necesidad) estilo Lau
    with col_chart_bar:
        st.markdown("##### Inventario vs Necesidad")
        st.markdown(f"<p style='color: #718096; font-size: 0.85rem; margin-top: -8px;'>Stock actual vs Proyección para próximos 7 días</p>", unsafe_allow_html=True)
        
        # Obtener valores para todas las sucursales de este ingrediente
        df_all_suc = df_alertas[df_alertas["ingrediente_id"] == selected_ing_id].copy()
        
        fig_bar = go.Figure()
        
        # Barras de Stock Actual (verde)
        fig_bar.add_trace(go.Bar(
            x=df_all_suc["sucursal"],
            y=df_all_suc["stock_actual_unidad_base"],
            name="Stock Actual",
            marker_color="#2F855A",
            hovertemplate="%{x}<br>Stock: %{y:.2f} " + unidad + "<extra></extra>"
        ))
        
        # Barras de Necesidad Real (rojo/vino)
        fig_bar.add_trace(go.Bar(
            x=df_all_suc["sucursal"],
            y=df_all_suc["necesidad_real"],
            name="Necesidad",
            marker_color="#B71C1C",
            hovertemplate="%{x}<br>Necesidad: %{y:.2f} " + unidad + "<extra></extra>"
        ))
        
        fig_bar.update_layout(
            margin=dict(l=10, r=10, t=10, b=10),
            height=340,
            barmode="group",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            xaxis=dict(showline=True, linecolor="#EAEAEA"),
            yaxis=dict(showgrid=True, gridcolor="#EAEAEA", linecolor="#EAEAEA")
        )
        
        st.plotly_chart(fig_bar, use_container_width=True)

    # 3. Detalle por Sucursal (Tabla inferior)
    st.markdown("<br>", unsafe_allow_html=True)
    st.markdown(f"##### Detalle por Sucursal ({selected_ing_name})")
    
    # Construir dataframe con los datos cruzados
    df_detalle_suc = df_all_suc.copy()
    
    # Calcular Consumo Promedio Diario
    df_detalle_suc["Consumo Promedio"] = df_detalle_suc["proyeccion"] / 7
    
    # Formatear el Estado
    df_detalle_suc["Estado"] = df_detalle_suc["alerta_tipo"].map({
        "Riesgo de Quiebre": "Crítico",
        "Sobre-pedido": "Alerta",
        "Insumo Olvidado": "Pendiente",
        "Correcto": "Óptimo"
    })
    
    # Acción Recomendada
    df_detalle_suc["Acción Recomendada"] = df_detalle_suc["alerta_tipo"].map({
        "Riesgo de Quiebre": "Pedir Urgente 🚨",
        "Sobre-pedido": "Reducir Pedido ⚠️",
        "Insumo Olvidado": "Programar Pedido ➕",
        "Correcto": "Mantener Orden ✅"
    })

    df_detalle_display = df_detalle_suc[[
        "sucursal", "Consumo Promedio", "stock_actual_unidad_base", "necesidad_real", "Estado", "Acción Recomendada"
    ]].rename(columns={
        "sucursal": "Sucursal",
        "stock_actual_unidad_base": "Stock Actual",
        "necesidad_real": "Necesidad (7 Días)"
    })

    column_config_table = {
        "Sucursal": st.column_config.TextColumn("Sucursal", disabled=True),
        "Consumo Promedio": st.column_config.NumberColumn("Consumo Promedio", format="%.2f %s" % (unidad,), disabled=True),
        "Stock Actual": st.column_config.NumberColumn("Stock Actual", format="%.2f %s" % (unidad,), disabled=True),
        "Necesidad (7 Días)": st.column_config.NumberColumn("Necesidad (7 Días)", format="%.2f %s" % (unidad,), disabled=True),
        "Estado": st.column_config.TextColumn("Estado", disabled=True),
        "Acción Recomendada": st.column_config.TextColumn("Acción Recomendada", disabled=True)
    }

    st.data_editor(
        df_detalle_display,
        column_config=column_config_table,
        hide_index=True,
        use_container_width=True,
        key="analytics_detail_table"
    )
