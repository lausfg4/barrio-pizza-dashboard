import streamlit as st
import pandas as pd
import os
import re
from logic import process_alerts, recalculate_alerts

def render_tab_chat():
    st.markdown("<h2 style='color: #2D2D2D; font-weight: 800; margin-bottom: 2px;'>Asistente IA</h2>", unsafe_allow_html=True)
    st.markdown(
        "<p style='color: #718096; font-size: 1.05rem; margin-bottom: 25px;'>Consulta y analiza el estado de abastecimiento y pedidos chateando con un modelo inteligente.</p>",
        unsafe_allow_html=True
    )

    # Inicializar alertas si no existen
    if "df_alertas" not in st.session_state:
        with st.spinner("Cargando datos de alertas..."):
            st.session_state.df_alertas = process_alerts("datos")
            
    df_alertas = st.session_state.df_alertas

    # Buscar la API Key
    api_key = None
    try:
        if "GEMINI_API_KEY" in st.secrets:
            api_key = st.secrets["GEMINI_API_KEY"]
    except Exception:
        pass
        
    if not api_key:
        api_key = os.environ.get("GEMINI_API_KEY")

    # Si no hay API Key configurada
    if not api_key:
        if "user_api_key" not in st.session_state:
            st.session_state.user_api_key = ""
            
        st.warning("🔑 **API Key no configurada:** No se detectó la clave `GEMINI_API_KEY` en el sistema.")
        user_key = st.text_input(
            "Ingresa tu API Key de Google Gemini para activar el asistente de chat:",
            type="password",
            value=st.session_state.user_api_key,
            help="Puedes crear una clave de API gratis ingresando a Google AI Studio."
        )
        if user_key:
            st.session_state.user_api_key = user_key
            st.success("¡API Key registrada con éxito para esta sesión! Recargando...")
            st.rerun()
        return

    # Inicializar historial de chat si no existe
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    # Mostrar sugerencias de preguntas rápidas estilo Lau (Image 2)
    st.markdown("<h5 style='color: #2D2D2D; font-weight: 700; margin-bottom: 12px;'>Sugerencias Rápidas</h5>", unsafe_allow_html=True)
    col_s1, col_s2, col_s3 = st.columns(3)
    if col_s1.button("🏢 ¿Qué sucursal tiene más quiebres?", use_container_width=True, key="sug_quiebres"):
        st.session_state.pending_prompt = "¿Qué sucursal tiene más alertas de quiebre de stock y por qué?"
    if col_s2.button("🛒 ¿Qué insumos se olvidaron?", use_container_width=True, key="sug_olvidados"):
        st.session_state.pending_prompt = "¿Qué insumos se clasifican como Insumo Olvidado en todas las sucursales?"
    if col_s3.button("📈 Proyección de harina para el fin de semana", use_container_width=True, key="sug_harina"):
        st.session_state.pending_prompt = "¿Cuál es la proyección de consumo y necesidad real para los tipos de Harina en las sucursales para el fin de semana?"

    st.markdown("<hr style='margin: 20px 0; border-top: 1px solid rgba(0,0,0,0.06);'>", unsafe_allow_html=True)

    # Contenedor de mensajes de chat
    chat_container = st.container()

    # Mostrar historial de mensajes guardados
    with chat_container:
        for idx, msg in enumerate(st.session_state.chat_history):
            # Usar default avatars de Streamlit para poder capturarlos con el CSS selector
            with st.chat_message(msg["role"]):
                content = msg["content"]
                
                # Comprobar si el mensaje contiene un borrador estructurado
                if "[BORRADOR:" in content:
                    parts = content.split("[BORRADOR:")
                    text_show = parts[0].strip()
                    st.markdown(text_show)
                    
                    draft_str = parts[1].split("]")[0].strip()
                    draft_parts = [x.strip() for x in draft_str.split("|")]
                    
                    if len(draft_parts) >= 4:
                        proveedor_d = draft_parts[0]
                        destino_d = draft_parts[1]
                        item_d = draft_parts[2]
                        cantidad_d = draft_parts[3]
                        
                        # Renderizar tarjeta interactiva beige/blanca
                        st.markdown(f"""
                        <div style='background-color: #FAF8F5; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-top: 15px; margin-bottom: 10px;'>
                            <div style='display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 15px;'>
                                <span style='font-weight: 800; font-size: 0.85rem; color: #4A5568;'>BORRADOR DE ORDEN</span>
                                <span style='background-color: #FFEBE9; color: #B71C1C; font-size: 0.75rem; font-weight: bold; padding: 3px 8px; border-radius: 12px;'>Pendiente de Aprobación</span>
                            </div>
                            <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem; margin-bottom: 10px;'>
                                <div><b style='color: #718096; font-size: 0.75rem;'>Proveedor</b><br><span style='color: #2D2D2D; font-weight: 600;'>{proveedor_d}</span></div>
                                <div><b style='color: #718096; font-size: 0.75rem;'>Destino</b><br><span style='color: #2D2D2D; font-weight: 600;'>{destino_d}</span></div>
                                <div style='margin-top: 8px;'><b style='color: #718096; font-size: 0.75rem;'>Ítem</b><br><span style='color: #2D2D2D; font-weight: 600;'>{item_d}</span></div>
                                <div style='margin-top: 8px;'><b style='color: #718096; font-size: 0.75rem;'>Cantidad</b><br><span style='color: #B71C1C; font-weight: bold;'>{cantidad_d}</span></div>
                            </div>
                        </div>
                        """, unsafe_allow_html=True)
                        
                        # Botones interactivos nativos de Streamlit
                        col_btn1, col_btn2 = st.columns([3, 1])
                        with col_btn1:
                            if st.button("Aprobar Orden ✅", key=f"approve_{idx}"):
                                try:
                                    qty_num = float(re.findall(r"[-+]?\d*\.\d+|\d+", cantidad_d)[0])
                                except Exception:
                                    qty_num = 1.0
                                    
                                destino_clean = destino_d.lower().strip()
                                item_clean = item_d.lower().strip()
                                
                                match_idx = None
                                for s_idx, s_row in df_alertas.iterrows():
                                    row_suc = s_row["sucursal"].lower().strip()
                                    row_ing = s_row["nombre"].lower().strip()
                                    if (row_suc in destino_clean or destino_clean in row_suc) and (row_ing in item_clean or item_clean in row_ing):
                                        match_idx = s_idx
                                        break
                                        
                                if match_idx is not None:
                                    st.session_state.df_alertas.loc[match_idx, "cantidad_formatos"] = qty_num
                                    st.session_state.df_alertas = recalculate_alerts(st.session_state.df_alertas)
                                    st.session_state.chat_history.append({
                                        "role": "assistant",
                                        "content": f"✅ ¡He registrado tu orden aprobada de **{qty_num:.0f} unidades** de **{item_d}** para **{destino_d}**!"
                                    })
                                    st.toast(f"¡Orden para {item_d} aprobada con éxito!", icon="✅")
                                    st.rerun()
                                else:
                                    st.error("No se pudo localizar el ingrediente o sucursal correspondiente en el sistema.")
                        with col_btn2:
                            st.button("Modificar", key=f"modify_{idx}")
                else:
                    st.markdown(content)

    # Leer la entrada del usuario de st.chat_input o capturar del botón de sugerencias
    user_prompt = st.chat_input("Escribe un mensaje al Asistente IA...")
    
    if "pending_prompt" in st.session_state:
        user_prompt = st.session_state.pending_prompt
        del st.session_state.pending_prompt

    if user_prompt:
        with chat_container:
            with st.chat_message("user"):
                st.markdown(user_prompt)
        st.session_state.chat_history.append({"role": "user", "content": user_prompt})

        # Preparar la tabla de datos simplificada para enviarla como contexto
        df_context = df_alertas[[
            "sucursal", "nombre", "es_perecedero", "proyeccion", 
            "stock_actual_unidad_base", "necesidad_real", 
            "cantidad_formatos", "formato_compra", "pedido_unidad_base", 
            "alerta_tipo", "alerta_mensaje", "proveedor"
        ]]
        context_csv = df_context.to_csv(index=False)

        # Definir las instrucciones del sistema con el contexto embebido
        system_instruction = f"""
Eres un asistente de compras inteligente para la cadena de pizzerías "Barrio Pizza" en Panamá. Tu misión es analizar los pedidos de la semana y ayudar a la gerente de compras a auditar y entender los problemas de stock.

A continuación se detalla el estado actual de las órdenes, stocks, necesidades reales y alertas de abastecimiento de todas las sucursales en formato CSV:
```csv
{context_csv}
```

Reglas estrictas para tu comportamiento:
1. Responde de forma amigable, profesional y estructurada en español. Usa viñetas o negritas de Markdown para que las respuestas sean fáciles de leer de un vistazo.
2. Basate exclusivamente en los datos del CSV anterior.
3. Si el usuario pregunta por alertas de quiebre (Riesgo de Quiebre), insumos olvidados (Insumo Olvidado) o sobre-pedidos, responde listando claramente la sucursal, el ingrediente, la cantidad implicada y la acción sugerida.
4. Si sugieres o recomiendas hacer una orden de compra para abastecer un insumo crítico, debes incluir al final de tu respuesta una línea con el siguiente formato exacto para que el sistema cree la tarjeta interactiva:
[BORRADOR: Nombre del Proveedor | Nombre de la Sucursal | Nombre del Insumo | Cantidad en unidades de formato (ej: 9 unidades)]
5. Si el usuario te hace una pregunta fuera del alcance de estos datos de abastecimiento, indícale de manera cortés que solo posees acceso a los datos de inventario y pedidos de la semana en curso.
        """

        # Ejecutar la consulta con el SDK de Google Generative AI
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            
            model = genai.GenerativeModel(
                model_name="gemini-3.5-flash",
                system_instruction=system_instruction
            )
            
            api_history = []
            for m in st.session_state.chat_history[:-1]:
                role = "user" if m["role"] == "user" else "model"
                clean_content = m["content"].split("[BORRADOR:")[0].strip()
                api_history.append({"role": role, "parts": [clean_content]})
                
            chat = model.start_chat(history=api_history)  # type: ignore
            
            with chat_container:
                with st.chat_message("assistant"):
                    with st.spinner("Analizando pedidos y existencias..."):
                        response = chat.send_message(user_prompt)
                        response_text = response.text
                        st.markdown(response_text)
                        
            st.session_state.chat_history.append({"role": "assistant", "content": response_text})
            st.rerun()
            
        except Exception as e:
            st.error(f"❌ Ocurrió un error al procesar tu solicitud con la API de Gemini: {e}")

    # Mostrar botón para borrar el historial de chat si hay mensajes
    if st.session_state.chat_history:
        st.write("")
        if st.button("Limpiar conversación 🗑️", use_container_width=True):
            st.session_state.chat_history = []
            st.toast("Historial de conversación borrado.", icon="🗑️")
            st.rerun()
