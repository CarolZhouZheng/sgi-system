-- =============================================================================
-- FUNCIÓN TRANSACCIONAL ATÓMICA: crear_pedido_con_detalles
-- Soluciona D-02: Garantiza que cabecera y detalles se inserten en una sola transacción.
-- Si algún detalle falla, PostgreSQL revierte automáticamente toda la operación.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.crear_pedido_con_detalles(
    p_id_destinatario BIGINT,
    p_id_usuario BIGINT,
    p_fecha_entrega DATE,
    p_prioridad VARCHAR,
    p_encargado_entrega VARCHAR,
    p_detalles JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pedido_id BIGINT;
    v_detalle RECORD;
    v_resultado JSONB;
BEGIN
    -- Validar que se envíen detalles
    IF p_detalles IS NULL OR jsonb_array_length(p_detalles) = 0 THEN
        RAISE EXCEPTION 'El pedido debe contener al menos un producto.';
    END IF;

    -- 1. Insertar cabecera del pedido
    INSERT INTO public.pedido (
        id_destinatario,
        id_usuario,
        fecha_entrega,
        prioridad,
        encargado_entrega,
        estado
    ) VALUES (
        p_id_destinatario,
        p_id_usuario,
        p_fecha_entrega,
        COALESCE(p_prioridad, 'NORMAL'),
        p_encargado_entrega,
        'PENDIENTE'
    )
    RETURNING id_pedido INTO v_pedido_id;

    -- 2. Insertar cada detalle de forma atómica
    FOR v_detalle IN 
        SELECT * FROM jsonb_to_recordset(p_detalles) AS x(id_producto BIGINT, cantidad NUMERIC)
    LOOP
        IF v_detalle.cantidad <= 0 THEN
            RAISE EXCEPTION 'La cantidad del producto % debe ser mayor a 0', v_detalle.id_producto;
        END IF;

        INSERT INTO public.detalle_pedido (
            id_pedido,
            id_producto,
            cantidad,
            cantidad_entregada
        ) VALUES (
            v_pedido_id,
            v_detalle.id_producto,
            v_detalle.cantidad,
            0
        );
    END LOOP;

    -- 3. Retornar el pedido recién creado
    SELECT to_jsonb(p.*) INTO v_resultado
    FROM public.pedido p
    WHERE p.id_pedido = v_pedido_id;

    RETURN v_resultado;
END;
$$;

-- =============================================================================
-- PERMISOS DE SEGURIDAD (Supabase / PostgreSQL)
-- Evita que la clave pública anónima (anon) ejecute directamente la función,
-- reservándola exclusivamente al backend (service_role) y usuarios autenticados.
-- =============================================================================
REVOKE EXECUTE ON FUNCTION public.crear_pedido_con_detalles(BIGINT, BIGINT, DATE, VARCHAR, VARCHAR, JSONB) FROM public;
REVOKE EXECUTE ON FUNCTION public.crear_pedido_con_detalles(BIGINT, BIGINT, DATE, VARCHAR, VARCHAR, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION public.crear_pedido_con_detalles(BIGINT, BIGINT, DATE, VARCHAR, VARCHAR, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.crear_pedido_con_detalles(BIGINT, BIGINT, DATE, VARCHAR, VARCHAR, JSONB) TO authenticated;

