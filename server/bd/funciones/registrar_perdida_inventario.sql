CREATE OR REPLACE FUNCTION public.registrar_perdida_inventario(
    p_id_producto BIGINT,
    p_id_lote BIGINT,
    p_id_usuario BIGINT,
    p_cantidad NUMERIC,
    p_motivo VARCHAR,
    p_tipo_perdida VARCHAR,
    p_fecha DATE,
    p_observaciones TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock_anterior NUMERIC;
    v_stock_nuevo NUMERIC;
    v_lote_cantidad NUMERIC;
    v_lote_producto BIGINT;
    v_id_perdida BIGINT;
BEGIN

    -- ============================================================
    -- 1. Validar cantidad
    -- ============================================================

    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad de la pérdida debe ser mayor a 0.';
    END IF;


    -- ============================================================
    -- 2. Validar usuario
    -- ============================================================

    IF NOT EXISTS (
        SELECT 1
        FROM public.usuario
        WHERE id_usuario = p_id_usuario
          AND estado = true
    ) THEN
        RAISE EXCEPTION 'El usuario no existe o está inactivo.';
    END IF;


    -- ============================================================
    -- 3. Obtener el stock del producto
    -- ============================================================

    SELECT stock_actual
    INTO v_stock_anterior
    FROM public.producto
    WHERE id_producto = p_id_producto
      AND estado = true
    FOR UPDATE;


    -- ============================================================
    -- 4. Verificar que el producto exista y esté activo
    -- ============================================================

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El producto no existe o está inactivo.';
    END IF;


    -- ============================================================
    -- 5. Verificar que haya suficiente stock
    -- ============================================================

    IF v_stock_anterior < p_cantidad THEN
        RAISE EXCEPTION
            'Stock insuficiente. Stock disponible: %, cantidad solicitada: %.',
            v_stock_anterior,
            p_cantidad;
    END IF;


    -- ============================================================
    -- 6. Validar lote si se proporcionó
    -- ============================================================

    IF p_id_lote IS NOT NULL THEN

        SELECT cantidad, id_producto
        INTO v_lote_cantidad, v_lote_producto
        FROM public.lote
        WHERE id_lote = p_id_lote
          AND estado = true
        FOR UPDATE;


        -- Verificar que el lote exista
        IF NOT FOUND THEN
            RAISE EXCEPTION 'El lote no existe o está inactivo.';
        END IF;


        -- Verificar que el lote pertenezca al producto
        IF v_lote_producto <> p_id_producto THEN
            RAISE EXCEPTION
                'El lote indicado no pertenece al producto seleccionado.';
        END IF;


        -- Verificar cantidad disponible en el lote
        IF v_lote_cantidad < p_cantidad THEN
            RAISE EXCEPTION
                'Cantidad insuficiente en el lote. Disponible: %, solicitada: %.',
                v_lote_cantidad,
                p_cantidad;
        END IF;

    END IF;


    -- ============================================================
    -- 7. Calcular nuevo stock
    -- ============================================================

    v_stock_nuevo := v_stock_anterior - p_cantidad;


    -- ============================================================
    -- 8. Registrar la pérdida
    -- ============================================================

    INSERT INTO public.perdida (
        id_producto,
        id_lote,
        id_usuario,
        cantidad,
        motivo,
        tipo_perdida,
        fecha,
        observaciones
    )
    VALUES (
        p_id_producto,
        p_id_lote,
        p_id_usuario,
        p_cantidad,
        p_motivo,
        p_tipo_perdida,
        COALESCE(p_fecha, CURRENT_DATE),
        p_observaciones
    )
    RETURNING id_perdida INTO v_id_perdida;


    -- ============================================================
    -- 9. Actualizar stock del producto
    -- ============================================================

    UPDATE public.producto
    SET stock_actual = v_stock_nuevo
    WHERE id_producto = p_id_producto;


    -- ============================================================
    -- 10. Actualizar lote si corresponde
    -- ============================================================

    IF p_id_lote IS NOT NULL THEN

        UPDATE public.lote
        SET cantidad = cantidad - p_cantidad,
            estado = CASE
                WHEN cantidad - p_cantidad <= 0 THEN false
                ELSE estado
            END
        WHERE id_lote = p_id_lote;

    END IF;


    -- ============================================================
    -- 11. Registrar movimiento de inventario
    -- ============================================================

    INSERT INTO public.movimiento_inventario (
        id_producto,
        id_lote,
        id_perdida,
        id_usuario,
        tipo_movimiento,
        cantidad,
        stock_anterior,
        stock_nuevo,
        observaciones
    )
    VALUES (
        p_id_producto,
        p_id_lote,
        v_id_perdida,
        p_id_usuario,
        'PERDIDA',
        p_cantidad,
        v_stock_anterior,
        v_stock_nuevo,
        p_observaciones
    );


    -- ============================================================
    -- 12. Registrar auditoría
    -- ============================================================

    INSERT INTO public.auditoria (
        id_usuario,
        accion,
        tabla_afectada,
        registro_id,
        detalle
    )
    VALUES (
        p_id_usuario,
        'REGISTRAR_PERDIDA',
        'perdida',
        v_id_perdida,
        'Se registró una pérdida de '
        || p_cantidad
        || ' unidades del producto '
        || p_id_producto
    );


    -- ============================================================
    -- 13. Retornar resultado
    -- ============================================================

    RETURN jsonb_build_object(
        'id_perdida', v_id_perdida,
        'id_producto', p_id_producto,
        'id_lote', p_id_lote,
        'id_usuario', p_id_usuario,
        'cantidad', p_cantidad,
        'stock_anterior', v_stock_anterior,
        'stock_nuevo', v_stock_nuevo,
        'motivo', p_motivo,
        'tipo_perdida', p_tipo_perdida,
        'fecha', COALESCE(p_fecha, CURRENT_DATE),
        'observaciones', p_observaciones
    );

END;
$$;