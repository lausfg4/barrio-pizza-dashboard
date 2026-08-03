import streamlit as st
import pandas as pd
from logic import process_alerts

def render_tab_suppliers():
    st.markdown("<h2 style='text-align: center; color: var(--primary-color, #E53935);'>📦 Órdenes de Compra por Proveedor</h2>", unsafe_allow_html=True)
    st.markdown(
        "<p style='text-align: center; font-size: 1.1rem; opacity: 0.8;'>Agrupa automáticamente los pedidos corregidos por su respectivo proveedor y expórtalos en formato CSV para su envío.</p>",
        unsafe_allow_html=True
    )
    st.markdown("---")

    # Inicializar alertas si no existen
    if "df_alertas" not in st.session_state:
        with st.spinner("Cargando datos de alertas..."):
            st.session_state.df_alertas = process_alerts("datos")
            
    df_alertas = st.session_state.df_alertas

    # Filtrar únicamente los insumos que tienen una cantidad pedida mayor a 0
    df_ordered = df_alertas[df_alertas["cantidad_formatos"] > 0].copy()

    if df_ordered.empty:
        st.info("ℹ️ **No hay pedidos registrados:** Actualmente todas las cantidades pedidas están en 0. Modifica las cantidades de formato en la pestaña 'Resumen y Alertas' para generar las órdenes de compra.")
        return

    # Obtener lista única de proveedores que tienen productos pedidos
    proveedores = sorted(df_ordered["proveedor"].unique())

    st.markdown(f"### 📋 Órdenes de Compra ({len(proveedores)} Proveedores Activos)")
    st.markdown("Haz clic sobre el nombre del proveedor para expandir su orden de compra detallada y descargar su archivo correspondiente:")

    for prov in proveedores:
        # Filtrar pedidos correspondientes a este proveedor
        df_prov = df_ordered[df_ordered["proveedor"] == prov].copy()
        
        # Formatear el DataFrame para visualización del proveedor
        df_prov_display = df_prov[[
            "nombre", "sucursal", "cantidad_formatos", "formato_compra", "pedido_unidad_base", "unidad_base"
        ]].rename(columns={
            "nombre": "Ingrediente / Producto",
            "sucursal": "Sucursal Destino",
            "cantidad_formatos": "Cantidad Pedida (Formatos)",
            "formato_compra": "Formato de Compra",
            "pedido_unidad_base": "Cantidad (Unidades)",
            "unidad_base": "Unidad de Medida"
        })
        
        # Calcular estadísticas rápidas para la cabecera
        total_formatos = df_prov["cantidad_formatos"].sum()
        total_productos = df_prov["nombre"].nunique()
        
        # Cabecera expandible
        with st.expander(f"🏢 {prov} — {total_productos} productos distintos ({total_formatos:.0f} formatos en total)"):
            st.dataframe(df_prov_display, hide_index=True, use_container_width=True)
            
            # Generar datos para descargar en CSV
            csv_data = df_prov_display.to_csv(index=False).encode('utf-8')
            
            # Botón de exportación
            st.download_button(
                label=f"📥 Descargar Pedido para {prov} (CSV)",
                data=csv_data,
                file_name=f"orden_compra_{prov.replace(' ', '_').lower()}.csv",
                mime="text/csv",
                key=f"download_prov_{prov.replace(' ', '_').lower()}",
                use_container_width=True
            )
