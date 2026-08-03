import os
import numpy as np
import pandas as pd

def load_data(data_dir: str = "datos") -> dict:
    """
    Carga los 4 archivos CSV del directorio especificado.
    Retorna un diccionario con los DataFrames.
    """
    files = {
        "ingredientes": "ingredientes.csv",
        "consumo": "consumo_historico.csv",
        "inventario": "inventario_actual.csv",
        "ordenes": "orden_compra_semana.csv"
    }
    
    dfs = {}
    for key, filename in files.items():
        filepath = os.path.join(data_dir, filename)
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"No se pudo encontrar el archivo de datos: {filepath}")
        dfs[key] = pd.read_csv(filepath)
    
    return dfs

def calculate_projections(df_consumo: pd.DataFrame) -> pd.DataFrame:
    """
    Calcula la proyección del consumo para la Semana 7 utilizando un promedio ponderado
    con pesos [0.05, 0.10, 0.15, 0.20, 0.25, 0.25] para las semanas S1 a S6.
    """
    # Pivotamos para tener las semanas como columnas: S1, S2, ..., S6
    df_pivot = df_consumo.pivot(
        index=["sucursal", "ingrediente_id"], 
        columns="semana", 
        values="consumo_unidad_base"
    )
    
    # Nos aseguramos de tener exactamente las columnas de S1 a S6
    weeks = ["S1", "S2", "S3", "S4", "S5", "S6"]
    for w in weeks:
        if w not in df_pivot.columns:
            df_pivot[w] = 0.0
            
    df_pivot = df_pivot[weeks]
    
    # Manejo de datos incompletos (NaN):
    # Rellenamos los NaN de cada fila con el promedio de consumo de esa misma fila.
    # Si toda la fila es NaN, rellenamos con 0.0.
    df_pivot = df_pivot.apply(lambda row: row.fillna(row.mean()), axis=1).fillna(0.0)
    
    # Pesos asignados a S1, S2, S3, S4, S5, S6
    weights = np.array([0.05, 0.10, 0.15, 0.20, 0.25, 0.25])
    
    # Multiplicación matricial (dot product) para calcular el promedio ponderado
    df_pivot["proyeccion"] = df_pivot[weeks].dot(weights)
    
    return df_pivot[["proyeccion"]].reset_index()

def process_alerts(data_dir: str = "datos") -> pd.DataFrame:
    """
    Combina proyecciones, inventario y órdenes para generar las alertas de compra.
    Retorna un DataFrame consolidado con métricas y alertas.
    """
    dfs = load_data(data_dir)
    
    df_ing = dfs["ingredientes"]
    df_cons = dfs["consumo"]
    df_inv = dfs["inventario"]
    df_ord = dfs["ordenes"]
    
    # 1. Proyectar consumo
    df_proj = calculate_projections(df_cons)
    
    # 2. Generar una base con todas las combinaciones posibles de sucursal e ingrediente
    # para asegurar que no omitimos ingredientes que no se pidieron ("Insumo Olvidado")
    sucursales = df_cons["sucursal"].unique()
    ingredientes = df_ing["ingrediente_id"].unique()
    
    cartesian_index = pd.MultiIndex.from_product(
        [sucursales, ingredientes], 
        names=["sucursal", "ingrediente_id"]
    )
    df_base = pd.DataFrame(index=cartesian_index).reset_index()
    
    # 3. Unir proyección
    df_merged = pd.merge(df_base, df_proj, on=["sucursal", "ingrediente_id"], how="left")
    df_merged["proyeccion"] = df_merged["proyeccion"].fillna(0.0)
    
    # 4. Unir inventario actual
    df_merged = pd.merge(df_merged, df_inv, on=["sucursal", "ingrediente_id"], how="left")
    df_merged["stock_actual_unidad_base"] = df_merged["stock_actual_unidad_base"].fillna(0.0)
    
    # 5. Calcular necesidad real = max(0, Proyección - Inventario Actual)
    df_merged["necesidad_real"] = (df_merged["proyeccion"] - df_merged["stock_actual_unidad_base"]).clip(lower=0)
    
    # 6. Unir orden de compra
    df_merged = pd.merge(df_merged, df_ord, on=["sucursal", "ingrediente_id"], how="left")
    df_merged["cantidad_formatos"] = df_merged["cantidad_formatos"].fillna(0.0)
    
    # 7. Unir catálogo de ingredientes para conversiones e información general
    df_merged = pd.merge(df_merged, df_ing, on="ingrediente_id", how="left")
    
    # Manejar posibles inconsistencias en el catálogo de ingredientes
    df_merged["unidad_base_por_formato"] = df_merged["unidad_base_por_formato"].fillna(1.0)
    df_merged["nombre"] = df_merged["nombre"].fillna(df_merged["ingrediente_id"])
    df_merged["unidad_base"] = df_merged["unidad_base"].fillna("und")
    df_merged["es_perecedero"] = df_merged["es_perecedero"].fillna("No")
    
    # 8. Convertir el pedido a unidad base: formatos * factor
    df_merged["pedido_unidad_base"] = df_merged["cantidad_formatos"] * df_merged["unidad_base_por_formato"]
    
    # 9. Asignar las alertas
    alert_types = []
    alert_messages = []
    alert_icons = []
    
    for _, row in df_merged.iterrows():
        proj = row["proyeccion"]
        inv = row["stock_actual_unidad_base"]
        nec = row["necesidad_real"]
        ped = row["pedido_unidad_base"]
        formato_val = row["unidad_base_por_formato"]
        formato_txt = row["formato_compra"]
        unidad = row["unidad_base"]
        ingrediente = row["nombre"]
        sucursal = row["sucursal"]
        
        # Alerta: Insumo Olvidado
        if nec > 0 and ped == 0:
            formato_sugerido = np.ceil(nec / formato_val)
            msg = (
                f"Insumo Olvidado: {sucursal} necesita {nec:.2f} {unidad} de {ingrediente} "
                f"pero no lo incluyó en el pedido. Se sugiere pedir al menos {formato_sugerido:.0f} {formato_txt}."
            )
            tipo = "Insumo Olvidado"
            icon = "🔵"
            
        # Alerta: Riesgo de Quiebre (Pedido < Necesidad Real)
        elif ped < nec:
            falta = nec - ped
            formato_sugerido = np.ceil(falta / formato_val)
            msg = (
                f"Riesgo de Quiebre: {sucursal} pide {ped:.2f} {unidad} de {ingrediente}, "
                f"pero requiere {nec:.2f} {unidad} (falta {falta:.2f} {unidad}). "
                f"Se sugiere agregar {formato_sugerido:.0f} {formato_txt} más."
            )
            tipo = "Riesgo de Quiebre"
            icon = "🔴"
            
        # Alerta: Sobre-pedido (Pedido > Necesidad Real + 1 Formato en unidad base)
        elif ped > (nec + formato_val):
            exceso = ped - nec
            formato_exceso = exceso / formato_val
            perecedero_warn = " (Insumo PERECEDERO - peligro de merma)" if row["es_perecedero"] == "Si" else ""
            msg = (
                f"Sobre-pedido: {sucursal} pide {ped:.2f} {unidad} ({row['cantidad_formatos']:.0f} {formato_txt}) "
                f"de {ingrediente}. Supera la necesidad real ({nec:.2f} {unidad}) por {exceso:.2f} {unidad}"
                f"{perecedero_warn}."
            )
            tipo = "Sobre-pedido"
            icon = "🟡"
            
        # Estado: Correcto
        else:
            msg = (
                f"Correcto: El pedido de {ped:.2f} {unidad} ({row['cantidad_formatos']:.0f} {formato_txt}) "
                f"cubre bien la necesidad real de {nec:.2f} {unidad} en {sucursal}."
            )
            tipo = "Correcto"
            icon = "🟢"
            
        alert_types.append(tipo)
        alert_messages.append(msg)
        alert_icons.append(icon)
        
    df_merged["alerta_tipo"] = alert_types
    df_merged["alerta_mensaje"] = alert_messages
    df_merged["alerta_icono"] = alert_icons
    
    return df_merged

if __name__ == "__main__":
    print("--- Probando carga y procesamiento de alertas ---")
    try:
        df_alertas = process_alerts("datos")
        print(f"Calculos completados exitosamente. Total de filas procesadas: {len(df_alertas)}")
        print("\nEjemplo de alertas de Riesgo de Quiebre (primeras 3):")
        quiebres = df_alertas[df_alertas["alerta_tipo"] == "Riesgo de Quiebre"]
        for _, row in quiebres.head(3).iterrows():
            print(f"[{row['alerta_tipo']}] {row['alerta_mensaje']}")
            
        print("\nEjemplo de alertas de Insumo Olvidado (primeras 3):")
        olvidados = df_alertas[df_alertas["alerta_tipo"] == "Insumo Olvidado"]
        for _, row in olvidados.head(3).iterrows():
            print(f"[{row['alerta_tipo']}] {row['alerta_mensaje']}")
            
        print("\nEjemplo de alertas de Sobre-pedido (primeras 3):")
        sobrepedidos = df_alertas[df_alertas["alerta_tipo"] == "Sobre-pedido"]
        for _, row in sobrepedidos.head(3).iterrows():
            print(f"[{row['alerta_tipo']}] {row['alerta_mensaje']}")
            
    except Exception as e:
        print(f"Error durante la prueba: {e}")

