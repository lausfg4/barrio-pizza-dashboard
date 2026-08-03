import streamlit as st
import pandas as pd
import numpy as np
import plotly.graph_objects as go
from logic import load_data

def render_tab_analytics():
    st.markdown("<h2 style='text-align: center; color: var(--primary-color, #E53935);'>📈 Análisis Histórico y Proyecciones</h2>", unsafe_allow_html=True)
    st.markdown(
        "<p style='text-align: center; font-size: 1.1rem; opacity: 0.8;'>Analiza las tendencias de consumo histórico de cada insumo y compáralo con el stock actual y la necesidad proyectada.</p>",
        unsafe_allow_html=True
    )
    st.markdown("---")

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

    # Verificar si df_alertas está inicializado en session_state (debería estarlo)
    if "df_alertas" not in st.session_state:
        from logic import process_alerts
        with st.spinner("Cargando alertas de abastecimiento..."):
            st.session_state.df_alertas = process_alerts("datos")

    df_consumo = st.session_state.df_consumo
    df_ing = st.session_state.df_ingredientes
    df_alertas = st.session_state.df_alertas

    # Selectores en columnas
    st.markdown("### 🎯 Parámetros de Análisis")
    col_sel1, col_sel2 = st.columns(2)
    
    with col_sel1:
        sucursales = sorted(df_consumo["sucursal"].unique())
        selected_sucursal = st.selectbox(
            "Selecciona una Sucursal:",
            options=sucursales,
            key="analytics_sucursal",
            help="Selecciona la sucursal para analizar su consumo."
        )
        
    with col_sel2:
        # Crear un mapa de nombre de ingrediente -> ingrediente_id para facilitar la selección
        ing_map = dict(zip(df_ing["nombre"], df_ing["ingrediente_id"]))
        sorted_ing_names = sorted(ing_map.keys())
        selected_ing_name = st.selectbox(
            "Selecciona un Insumo / Ingrediente:",
            options=sorted_ing_names,
            key="analytics_ingrediente",
            help="Selecciona el ingrediente que deseas analizar."
        )
        selected_ing_id = ing_map[selected_ing_name]

    # Obtener datos para la combinación seleccionada
    # 1. Histórico S1-S6
    df_hist_filtered = df_consumo[
        (df_consumo["sucursal"] == selected_sucursal) & 
        (df_consumo["ingrediente_id"] == selected_ing_id)
    ]
    
    # Asegurar el orden de semanas S1 a S6
    weeks = ["S1", "S2", "S3", "S4", "S5", "S6"]
    hist_dict = dict(zip(df_hist_filtered["semana"], df_hist_filtered["consumo_unidad_base"]))
    hist_values = [hist_dict.get(w, 0.0) for w in weeks]

    # 2. Proyección y stock actual de la combinación
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
    formato_txt = row_data["formato_compra"]

    st.markdown("---")
    
    # Mostrar métricas resumidas del ingrediente seleccionado
    st.markdown(f"#### 📊 Resumen para **{selected_ing_name}** en **{selected_sucursal}**")
    
    col_m1, col_m2, col_m3, col_m4 = st.columns(4)
    col_m1.metric("Stock Actual", f"{stock_val:.2f} {unidad}")
    col_m2.metric("Proyección Semana 7", f"{proyeccion_val:.2f} {unidad}")
    col_m3.metric("Necesidad Real", f"{necesidad_val:.2f} {unidad}", delta=-necesidad_val if necesidad_val == 0 else necesidad_val, delta_color="inverse")
    
    # Obtener el estado actual de la alerta
    alerta_status = f"{row_data['alerta_icono']} {row_data['alerta_tipo']}"
    col_m4.metric("Estado de Alerta", alerta_status)

    # Contenedor para gráficos
    col_chart_line, col_chart_bar = st.columns([5, 3])

    # 1. Gráfico de líneas (Histórico + Proyección)
    with col_chart_line:
        st.markdown("##### 📈 Consumo Histórico (S1-S6) vs Proyección S7")
        
        # Unir histórico y proyección para el gráfico
        x_all = weeks + ["S7"]
        
        fig_line = go.Figure()
        
        # Línea de histórico (S1 a S6)
        fig_line.add_trace(go.Scatter(
            x=weeks,
            y=hist_values,
            mode="lines+markers",
            name="Histórico (S1-S6)",
            line=dict(color="#0F172A", width=4, shape="spline"),
            marker=dict(size=9, color="#0F172A"),
            hovertemplate="Semana %{x}<br>Consumo: %{y:.2f} " + unidad + "<extra></extra>"
        ))
        
        # Segmento proyectado (S6 a S7)
        fig_line.add_trace(go.Scatter(
            x=["S6", "S7"],
            y=[hist_values[-1], proyeccion_val],
            mode="lines+markers",
            name="Proyección S7",
            line=dict(color="#E53935", width=4, dash="dash"),
            marker=dict(size=12, symbol="star", color="#E53935"),
            hovertemplate="Semana %{x}<br>Proyección: %{y:.2f} " + unidad + "<extra></extra>"
        ))
        
        # Ajustar diseño del gráfico de líneas
        fig_line.update_layout(
            margin=dict(l=10, r=10, t=10, b=10),
            height=380,
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
            xaxis=dict(
                showline=True,
                showgrid=True,
                gridcolor="#E2E8F0",
                linecolor="#E2E8F0"
            ),
            yaxis=dict(
                title=f"Consumo ({unidad})",
                showgrid=True,
                gridcolor="#E2E8F0",
                linecolor="#E2E8F0",
                zeroline=True,
                zerolinecolor="#E2E8F0"
            ),
            hovermode="x unified"
        )
        
        st.plotly_chart(fig_line, use_container_width=True)

    # 2. Gráfico de barras (Inventario Actual vs Necesidad Real)
    with col_chart_bar:
        st.markdown("##### ⚖️ Stock vs Necesidad Real")
        
        fig_bar = go.Figure()
        
        # Barras para stock actual y necesidad real
        fig_bar.add_trace(go.Bar(
            x=["Stock Actual", "Necesidad Real"],
            y=[stock_val, necesidad_val],
            marker_color=["#94A3B8", "#0F172A"],
            text=[f"{stock_val:.2f} {unidad}", f"{necesidad_val:.2f} {unidad}"],
            textposition="auto",
            hovertemplate="%{x}: %{y:.2f} " + unidad + "<extra></extra>",
            showlegend=False
        ))
        
        # Línea de referencia para la Proyección de Consumo S7
        fig_bar.add_shape(
            type="line",
            x0=-0.4,
            y0=proyeccion_val,
            x1=1.4,
            y1=proyeccion_val,
            line=dict(color="#E53935", width=3, dash="dash"),
        )
        
        # Anotación para la línea de Proyección
        fig_bar.add_annotation(
            x=0.5,
            y=proyeccion_val,
            text=f"Proyección: {proyeccion_val:.2f}",
            showarrow=False,
            yshift=12,
            font=dict(color="#E53935", size=11, weight="bold")
        )
        
        # Ajustar diseño del gráfico de barras
        fig_bar.update_layout(
            margin=dict(l=10, r=10, t=10, b=10),
            height=380,
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            xaxis=dict(
                showline=True,
                linecolor="#E2E8F0"
            ),
            yaxis=dict(
                title=f"Cantidad ({unidad})",
                showgrid=True,
                gridcolor="#E2E8F0",
                linecolor="#E2E8F0"
            )
        )
        
        st.plotly_chart(fig_bar, use_container_width=True)

    # Explicación del comportamiento del insumo para el negocio
    st.markdown("### 💡 Análisis de Abastecimiento")
    with st.expander("Ver Interpretación de Datos", expanded=True):
        if necesidad_val > 0:
            st.warning(
                f"🚨 **Déficit Detectado:** El stock actual de **{stock_val:.2f} {unidad}** no es suficiente para cubrir "
                f"el consumo proyectado de **{proyeccion_val:.2f} {unidad}** para la Semana 7. "
                f"Es necesario pedir al menos **{necesidad_val:.2f} {unidad}**, lo cual equivale a la orden sugerida en la primera pestaña."
            )
        else:
            exceso_stock = stock_val - proyeccion_val
            st.success(
                f"✅ **Stock Suficiente:** El stock actual de **{stock_val:.2f} {unidad}** cubre de sobra "
                f"la proyección de **{proyeccion_val:.2f} {unidad}** para la Semana 7. "
                f"Tienes un excedente de seguridad de **{exceso_stock:.2f} {unidad}**, por lo que **no se requiere ordenar este insumo** esta semana."
            )
            
        st.markdown(
            f"**Formato de Compra de este ingrediente:** `{formato_txt}`. Las órdenes de compra solo pueden ser enviadas "
            f"en múltiplos de este formato. Ten en cuenta que si el insumo es clasificado como **Perecedero (`{row_data['es_perecedero']}`)**, "
            f"cualquier sobre-pedido incrementará directamente el riesgo de desperdicio de comida (merma)."
        )
