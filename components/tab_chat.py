import streamlit as st
import pandas as pd
import os
from logic import process_alerts

def render_tab_chat():
    st.markdown("<h2 style='color: #2D2D2D; font-weight: 800; margin-bottom: 2px;'>Asistente IA</h2>", unsafe_allow_html=True)
    st.markdown(
        "<p style='color: #718096; font-size: 1.05rem; margin-bottom: 25px;'>Consulta y analiza el estado de abastecimiento y pedidos chateando con un modelo inteligente.</p>",
        unsafe_allow_html=True
    )

    # Inicializar alertas en session_state si no existen
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
        else:
            st.info(
                "💡 **Consejo:** Para automatizar esto en producción, define la variable de entorno "
                "`GEMINI_API_KEY` o crea un archivo `.streamlit/secrets.toml` con la propiedad "
                "`GEMINI_API_KEY = 'tu_clave'`."
            )
            return

    # Inicializar historial de chat en session_state si no existe
    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    # Mostrar sugerencias de preguntas rápidas (Imagen 2 de Lau)
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

    # Mostrar historial de mensajes guardados con avatares estéticos
    with chat_container:
        for msg in st.session_state.chat_history:
            avatar_icon = "🤖" if msg["role"] == "assistant" else "👤"
            with st.chat_message(msg["role"], avatar=avatar_icon):
                st.markdown(msg["content"])

    # Leer la entrada del usuario de st.chat_input o capturar del botón de sugerencias
    user_prompt = st.chat_input("Escribe un mensaje al Asistente IA...")
    
    if "pending_prompt" in st.session_state:
        user_prompt = st.session_state.pending_prompt
        del st.session_state.pending_prompt

    if user_prompt:
        # Mostrar el mensaje del usuario en tiempo real
        with chat_container:
            with st.chat_message("user", avatar="👤"):
                st.markdown(user_prompt)
        st.session_state.chat_history.append({"role": "user", "content": user_prompt})

        # Preparar la tabla de datos simplificada para enviarla como contexto
        df_context = df_alertas[[
            "sucursal", "nombre", "es_perecedero", "proyeccion", 
            "stock_actual_unidad_base", "necesidad_real", 
            "cantidad_formatos", "formato_compra", "pedido_unidad_base", 
            "alerta_tipo", "alerta_mensaje"
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
4. Si el usuario te hace una pregunta fuera del alcance de estos datos de abastecimiento, indícale de manera cortés que solo posees acceso a los datos de inventario y pedidos de la semana en curso.
        """

        # Ejecutar la consulta con el SDK de Google Generative AI
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            
            # Configurar el modelo y la instrucción del sistema
            model = genai.GenerativeModel(
                model_name="gemini-3.5-flash",
                system_instruction=system_instruction
            )
            
            # Formatear el historial de chat acumulado para la API de Gemini
            api_history = []
            for m in st.session_state.chat_history[:-1]:
                role = "user" if m["role"] == "user" else "model"
                api_history.append({"role": role, "parts": [m["content"]]})
                
            # Establecer sesión de chat
            chat = model.start_chat(history=api_history)  # type: ignore
            
            # Obtener respuesta del modelo
            with chat_container:
                with st.chat_message("assistant", avatar="🤖"):
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
