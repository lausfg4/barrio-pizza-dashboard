import streamlit as st
import pandas as pd
from logic import process_alerts

def render_tab_suppliers():
    st.markdown("<h2 style='color: #2D2D2D; font-weight: 800; margin-bottom: 2px;'>Pedidos por Proveedor</h2>", unsafe_allow_html=True)
    st.markdown(
        "<p style='color: #718096; font-size: 1.05rem; margin-bottom: 25px;'>Gestión y revisión de órdenes activas agrupadas por proveedor.</p>",
        unsafe_allow_html=True
    )

    # Inicializar alertas si no existen
    if "df_alertas" not in st.session_state:
        with st.spinner("Cargando datos de alertas..."):
            st.session_state.df_alertas = process_alerts("datos")
            
    df_alertas = st.session_state.df_alertas

    # Filtrar únicamente los insumos que tienen una cantidad pedida mayor a 0
    df_ordered = df_alertas[df_alertas["cantidad_formatos"] > 0].copy()

    if df_ordered.empty:
        st.info("ℹ️ **No hay pedidos registrados:** Actualmente todas las cantidades pedidas están en 0. Modifica las cantidades de formato en la pestaña 'Resumen & Alertas' para generar las órdenes de compra.")
        return

    # Obtener lista única de proveedores que tienen productos pedidos
    proveedores = sorted(df_ordered["proveedor"].unique())

    st.markdown(f"### 📋 Órdenes de Compra ({len(proveedores)} Proveedores Activos)")

    for idx, prov in enumerate(proveedores):
        # Filtrar pedidos correspondientes a este proveedor
        df_prov = df_ordered[df_ordered["proveedor"] == prov].copy()
        
        # Obtener iniciales del proveedor (ej: Distribuidora Lácteos -> DL)
        initials = "".join([w[0].upper() for w in prov.split() if w])[:2]
        
        # Generar código de producto y precios ficticios de forma determinista para la tabla
        items_data = []
        total_cost = 0.0
        for i, row in df_prov.iterrows():
            name = row["nombre"]
            qty = row["cantidad_formatos"]
            formato = row["formato_compra"]
            
            # Generar código basado en iniciales de proveedor e índice
            code = f"{initials}-{i % 100 + 1:03d}"
            
            # Precio ficticio determinista basado en el nombre del ingrediente
            price_unit = float((hash(name) % 40) + 12.50)
            subtotal = qty * price_unit
            total_cost += subtotal
            
            items_data.append({
                "CÓDIGO": code,
                "DESCRIPCIÓN": f"{name} ({formato})",
                "CANTIDAD": f"{qty:.0f} unid.",
                "PRECIO UNIT.": f"${price_unit:.2f}",
                "SUBTOTAL": f"${subtotal:.2f}",
                # Datos crudos para exportación
                "raw_price": price_unit,
                "raw_subtotal": subtotal
            })
            
        df_prov_display = pd.DataFrame(items_data)
        
        # Asignar un estado de entrega y número de orden ficticios para coincidir con la imagen 3
        order_num = f"#ORD-2026-44{idx+1}"
        if idx % 3 == 0:
            status_txt = "🔴 Pendiente de Confirmación"
            delivery_txt = "Entrega estimada: Mañana"
        elif idx % 3 == 1:
            status_txt = "🟢 Confirmada"
            delivery_txt = "Entrega estimada: Jueves"
        else:
            status_txt = "🔵 En Camino"
            delivery_txt = "Entrega estimada: Hoy"
            
        # Título del expander
        expander_title = f" [{initials}]  {prov}  —  Orden {order_num}  •  {delivery_txt}  •  {status_txt}"
        
        with st.expander(expander_title):
            # Mostrar la tabla formateada como en la imagen
            st.dataframe(
                df_prov_display[["CÓDIGO", "DESCRIPCIÓN", "CANTIDAD", "PRECIO UNIT.", "SUBTOTAL"]],
                hide_index=True,
                use_container_width=True
            )
            
            # Fila inferior con botón de descarga a la izquierda y costo total a la derecha en rojo vino
            col_csv, col_excel, col_total = st.columns([2, 2, 5])
            with col_csv:
                # Generar datos CSV para exportar
                df_export = df_prov_display[["CÓDIGO", "DESCRIPCIÓN", "CANTIDAD", "PRECIO UNIT.", "SUBTOTAL"]].copy()
                csv_data = df_export.to_csv(index=False).encode('utf-8')
                
                st.download_button(
                    label="📥 CSV",
                    data=csv_data,
                    file_name=f"orden_compra_{prov.replace(' ', '_').lower()}.csv",
                    mime="text/csv",
                    key=f"dl_csv_{prov.replace(' ', '_').lower()}",
                    use_container_width=True
                )
            with col_excel:
                # Botón de Excel estético
                st.button("📄 Excel", key=f"btn_excel_{prov.replace(' ', '_').lower()}", use_container_width=True)
                
            with col_total:
                # Alineación a la derecha del precio en rojo vino
                st.markdown(
                    f"<div style='text-align: right; padding-top: 5px;'>"
                    f"<span style='color: #718096; font-size: 0.95rem; font-weight: 600;'>Total Orden: </span>"
                    f"<span style='color: #A80F1A; font-size: 1.35rem; font-weight: 800;'>${total_cost:,.2f}</span>"
                    f"</div>",
                    unsafe_allow_html=True
                )
