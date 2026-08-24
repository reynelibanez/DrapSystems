/**
 * API SERVICE PARA EL MÓDULO DE JOYERÍA
 * Todas las operaciones con Supabase para tablas jwl_*
 */

import { supabase } from '../supabase';
import type {
  JwlMateriaPrima,
  JwlCompraMaterial,
  JwlJoya,
  JwlFichaCosto,
  JwlProduccion,
  JwlVenta,
  JwlGastoGeneral,
  JwlMateriaPrimaFormData,
  JwlCompraMaterialFormData,
  JwlJoyaFormData,
  JwlFichaCostoFormData,
  JwlProduccionFormData,
  JwlVentaFormData,
  JwlGastoGeneralFormData,
  JwlDashboardStats,
  JwlValorInventarioMaterial,
  JwlValorInventarioJoya,
  JwlEstadisticas,
  JwlResumenVentasPorJoya,
  JwlMoneda,
  JwlReporteFinanciero,
  JwlReporteVentas,
  JwlReporteProduccion,
  JwlReporteInventario
} from '../types/jewelry.types';

// =====================================================
// HELPER: Obtener business_id del usuario actual
// =====================================================

async function getCurrentBusinessId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuario no autenticado');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', user.id)
    .single();

  if (error || !profile?.business_id) {
    throw new Error('No se pudo obtener el business_id del usuario');
  }

  return profile.business_id;
}

// =====================================================
// MATERIAS PRIMAS
// =====================================================

export async function getMateriaPrimas(): Promise<JwlMateriaPrima[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_materias_primas')
    .select('*')
    .eq('business_id', businessId)
    .order('nombre');

  if (error) {
    console.error('Error loading materias primas:', error);
    console.error('Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw error;
  }
  return data || [];
}

export async function getMateriaPrimaById(id: string): Promise<JwlMateriaPrima | null> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_materias_primas')
    .select('*')
    .eq('id', id)
    .eq('business_id', businessId)
    .single();

  if (error) throw error;
  return data;
}

export async function createMateriaPrima(data: JwlMateriaPrimaFormData): Promise<JwlMateriaPrima> {
  const businessId = await getCurrentBusinessId();
  
  const { data: newData, error } = await supabase
    .from('jwl_materias_primas')
    .insert({ ...data, business_id: businessId })
    .select()
    .single();

  if (error) throw error;
  return newData;
}

export async function updateMateriaPrima(id: string, data: Partial<JwlMateriaPrimaFormData>): Promise<JwlMateriaPrima> {
  const businessId = await getCurrentBusinessId();
  
  const { data: updatedData, error } = await supabase
    .from('jwl_materias_primas')
    .update(data)
    .eq('id', id)
    .eq('business_id', businessId)
    .select()
    .single();

  if (error) throw error;
  return updatedData;
}

export async function deleteMateriaPrima(id: string): Promise<void> {
  const businessId = await getCurrentBusinessId();
  
  const { error } = await supabase
    .from('jwl_materias_primas')
    .delete()
    .eq('id', id)
    .eq('business_id', businessId);

  if (error) throw error;
}

// =====================================================
// COMPRAS DE MATERIALES
// =====================================================

export async function getComprasMateriales(): Promise<JwlCompraMaterial[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_compras_materiales')
    .select(`
      *,
      materia_prima:jwl_materias_primas!inner(*)
    `)
    .eq('jwl_materias_primas.business_id', businessId)
    .order('fecha_compra', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getComprasByMaterial(materiaPrimaId: string): Promise<JwlCompraMaterial[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_compras_materiales')
    .select(`
      *,
      materia_prima:jwl_materias_primas!inner(*)
    `)
    .eq('materia_prima_id', materiaPrimaId)
    .eq('jwl_materias_primas.business_id', businessId)
    .order('fecha_compra', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCompraMaterial(data: JwlCompraMaterialFormData): Promise<JwlCompraMaterial> {
  const { data: newData, error } = await supabase
    .from('jwl_compras_materiales')
    .insert(data)
    .select(`
      *,
      materia_prima:jwl_materias_primas(*)
    `)
    .single();

  if (error) throw error;
  return newData;
}

// =====================================================
// JOYAS
// =====================================================

export async function getJoyas(): Promise<JwlJoya[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_joyas')
    .select('*')
    .eq('business_id', businessId)
    .order('nombre');

  if (error) throw error;
  return data || [];
}

export async function getJoyaById(id: string): Promise<JwlJoya | null> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_joyas')
    .select('*')
    .eq('id', id)
    .eq('business_id', businessId)
    .single();

  if (error) throw error;
  return data;
}

export async function createJoya(data: JwlJoyaFormData): Promise<JwlJoya> {
  const businessId = await getCurrentBusinessId();
  
  const { data: newData, error } = await supabase
    .from('jwl_joyas')
    .insert({ ...data, business_id: businessId })
    .select()
    .single();

  if (error) throw error;
  return newData;
}

export async function updateJoya(id: string, data: Partial<JwlJoyaFormData>): Promise<JwlJoya> {
  const businessId = await getCurrentBusinessId();
  
  const { data: updatedData, error } = await supabase
    .from('jwl_joyas')
    .update(data)
    .eq('id', id)
    .eq('business_id', businessId)
    .select()
    .single();

  if (error) throw error;
  return updatedData;
}

export async function deleteJoya(id: string): Promise<void> {
  const businessId = await getCurrentBusinessId();
  
  const { error } = await supabase
    .from('jwl_joyas')
    .delete()
    .eq('id', id)
    .eq('business_id', businessId);

  if (error) throw error;
}

// =====================================================
// FICHA DE COSTO (Bill of Materials)
// =====================================================

export async function getFichaCostoByJoya(joyaId: string): Promise<JwlFichaCosto[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_ficha_costo')
    .select(`
      *,
      materia_prima:jwl_materias_primas!inner(*)
    `)
    .eq('joya_id', joyaId)
    .eq('jwl_materias_primas.business_id', businessId);

  if (error) throw error;
  return data || [];
}

export async function addMaterialToFichaCosto(data: JwlFichaCostoFormData): Promise<JwlFichaCosto> {
  const businessId = await getCurrentBusinessId();
  
  // Obtener el costo actual de la materia prima
  const { data: materiaPrima, error: mpError } = await supabase
    .from('jwl_materias_primas')
    .select('costo_unitario_actual')
    .eq('id', data.materia_prima_id)
    .eq('business_id', businessId)
    .single();

  if (mpError) throw mpError;

  const { data: newData, error } = await supabase
    .from('jwl_ficha_costo')
    .insert({
      ...data,
      costo_unitario_momento: materiaPrima.costo_unitario_actual
    })
    .select(`
      *,
      materia_prima:jwl_materias_primas(*)
    `)
    .single();

  if (error) throw error;
  return newData;
}

export async function updateMaterialInFichaCosto(
  id: string,
  cantidad_usada: number
): Promise<JwlFichaCosto> {
  const { data: updatedData, error } = await supabase
    .from('jwl_ficha_costo')
    .update({ cantidad_usada })
    .eq('id', id)
    .select(`
      *,
      materia_prima:jwl_materias_primas(*)
    `)
    .single();

  if (error) throw error;
  return updatedData;
}

export async function removeMaterialFromFichaCosto(id: string): Promise<void> {
  const { error } = await supabase
    .from('jwl_ficha_costo')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// =====================================================
// PRODUCCIÓN
// =====================================================

export async function getProduccion(): Promise<JwlProduccion[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_produccion')
    .select(`
      *,
      joya:jwl_joyas!inner(*)
    `)
    .eq('business_id', businessId)
    .order('fecha_produccion', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getProduccionByJoya(joyaId: string): Promise<JwlProduccion[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_produccion')
    .select(`
      *,
      joya:jwl_joyas!inner(*)
    `)
    .eq('joya_id', joyaId)
    .eq('business_id', businessId)
    .order('fecha_produccion', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createProduccion(data: JwlProduccionFormData): Promise<JwlProduccion> {
  const businessId = await getCurrentBusinessId();
  
  // Extraer campos opcionales
  const { peso_producto, materiales_usados, ...produccionData } = data;
  
  try {
    console.log('🏭 Creando producción:', produccionData);
    
    // 1. Obtener la joya para calcular el costo del lote
    const { data: joya, error: joyaError } = await supabase
      .from('jwl_joyas')
      .select('costo_produccion')
      .eq('id', produccionData.joya_id)
      .eq('business_id', businessId)
      .single();

    if (joyaError) {
      console.error('❌ Error obteniendo joya:', joyaError);
      throw joyaError;
    }

    // Calcular costo total del lote
    const costo_total_lote = joya.costo_produccion * produccionData.cantidad_producida;
    console.log(`💰 Costo del lote: ${costo_total_lote} (${joya.costo_produccion} × ${produccionData.cantidad_producida})`);
    
    // 2. Obtener la ficha de costo de la joya (OPCIONAL)
    const { data: fichaCosto, error: fichaError } = await supabase
      .from('jwl_ficha_costo')
      .select(`
        *,
        materia_prima:jwl_materias_primas!inner(*)
      `)
      .eq('joya_id', produccionData.joya_id)
      .eq('jwl_materias_primas.business_id', businessId);

    if (fichaError) {
      console.error('❌ Error obteniendo ficha de costo:', fichaError);
      throw fichaError;
    }

    const tieneFichaCosto = fichaCosto && fichaCosto.length > 0;
    console.log(`📋 Ficha de costo: ${tieneFichaCosto ? `${fichaCosto.length} materiales` : 'No configurada'}`);

    // 3. Si hay materiales_usados proporcionados, verificar stock
    if (materiales_usados && materiales_usados.length > 0) {
      console.log(`🔍 Verificando stock para ${materiales_usados.length} materiales...`);
      
      for (const materialUsado of materiales_usados) {
        const cantidadTotal = materialUsado.cantidad * produccionData.cantidad_producida;
        
        const { data: material, error: materialError } = await supabase
          .from('jwl_materias_primas')
          .select('nombre, stock_actual, unidad_medida')
          .eq('id', materialUsado.material_id)
          .eq('business_id', businessId)
          .single();

        if (materialError) throw materialError;

        console.log(`   - ${material.nombre}: necesita ${cantidadTotal}, disponible ${material.stock_actual}`);

        if (material.stock_actual < cantidadTotal) {
          throw new Error(
            `Stock insuficiente de ${material.nombre}: necesita ${cantidadTotal} ${material.unidad_medida}, disponible ${material.stock_actual} ${material.unidad_medida}`
          );
        }
      }
      
      console.log('✅ Stock suficiente para todos los materiales');
    }
    // Si no hay materiales_usados pero hay ficha de costo, verificar stock de la ficha
    else if (tieneFichaCosto) {
      const cantidadProducir = produccionData.cantidad_producida;
      const materialesInsuficientes: string[] = [];

      console.log(`🔍 Verificando stock desde ficha de costo para ${cantidadProducir} unidades...`);

      for (const item of fichaCosto) {
        const cantidadNecesaria = item.cantidad_usada * cantidadProducir;
        const stockActual = item.materia_prima.stock_actual;

        console.log(`   - ${item.materia_prima.nombre}: necesita ${cantidadNecesaria}, disponible ${stockActual}`);

        if (stockActual < cantidadNecesaria) {
          materialesInsuficientes.push(
            `${item.materia_prima.nombre} (necesita ${cantidadNecesaria}, disponible ${stockActual})`
          );
        }
      }

      if (materialesInsuficientes.length > 0) {
        console.error('❌ Stock insuficiente:', materialesInsuficientes);
        throw new Error(
          `Stock insuficiente de materiales:\n${materialesInsuficientes.join('\n')}`
        );
      }

      console.log('✅ Stock suficiente para todos los materiales');
    }

    // 4. Crear el registro de producción con TODOS los campos
    console.log('💾 Creando registro de producción...');
    const dataToInsert: any = {
      ...produccionData,
      business_id: businessId,
      costo_total_lote
    };
    
    // Agregar peso_producto si se proporcionó
    if (peso_producto !== undefined && peso_producto !== null) {
      dataToInsert.peso_producto = peso_producto;
      console.log(`⚖️  Peso del producto: ${peso_producto}g`);
    }
    
    // Agregar materiales_usados si se proporcionaron
    if (materiales_usados && materiales_usados.length > 0) {
      dataToInsert.materiales_usados = materiales_usados;
      console.log(`📦 Materiales usados: ${materiales_usados.length} materiales`);
    }
    
    const { data: newData, error: produccionError } = await supabase
      .from('jwl_produccion')
      .insert(dataToInsert)
      .select(`
        *,
        joya:jwl_joyas(*)
      `)
      .single();

    if (produccionError) {
      console.error('❌ Error creating produccion:', produccionError);
      throw produccionError;
    }

    console.log('✅ Registro de producción creado:', newData.id);

    // 5. Rebajar stock de materiales
    if (materiales_usados && materiales_usados.length > 0) {
      // Usar los materiales proporcionados directamente
      console.log('📉 Rebajando stock de materiales (desde materiales_usados)...');
      
      for (const materialUsado of materiales_usados) {
        const cantidadTotal = materialUsado.cantidad * produccionData.cantidad_producida;
        
        const { data: material, error: materialError } = await supabase
          .from('jwl_materias_primas')
          .select('nombre, stock_actual')
          .eq('id', materialUsado.material_id)
          .eq('business_id', businessId)
          .single();

        if (materialError) throw materialError;

        const nuevoStock = material.stock_actual - cantidadTotal;
        console.log(`   - ${material.nombre}: ${material.stock_actual} → ${nuevoStock}`);
        
        const { error: updateError } = await supabase
          .from('jwl_materias_primas')
          .update({ stock_actual: nuevoStock })
          .eq('id', materialUsado.material_id)
          .eq('business_id', businessId);

        if (updateError) {
          console.error(`❌ Error updating material stock for ${material.nombre}:`, updateError);
          throw new Error(`Error al actualizar stock de ${material.nombre}`);
        }
        
        console.log(`   ✅ Stock actualizado para ${material.nombre}`);
      }
    } else if (tieneFichaCosto) {
      // Usar la ficha de costo
      const cantidadProducir = produccionData.cantidad_producida;
      
      console.log('📉 Rebajando stock de materiales (desde ficha de costo)...');
      
      for (const item of fichaCosto) {
        const cantidadARebajar = item.cantidad_usada * cantidadProducir;
        const nuevoStock = item.materia_prima.stock_actual - cantidadARebajar;
        
        console.log(`   - ${item.materia_prima.nombre}: ${item.materia_prima.stock_actual} → ${nuevoStock}`);
        
        const { error: updateError } = await supabase
          .from('jwl_materias_primas')
          .update({
            stock_actual: nuevoStock
          })
          .eq('id', item.materia_prima_id)
          .eq('business_id', businessId);

        if (updateError) {
          console.error(`❌ Error updating material stock for ${item.materia_prima.nombre}:`, updateError);
          throw new Error(`Error al actualizar stock de ${item.materia_prima.nombre}`);
        }
        
        console.log(`   ✅ Stock actualizado para ${item.materia_prima.nombre}`);
      }
    }
    
    console.log('✅ Stock de materiales rebajado correctamente');

    // 6. Aumentar el stock de la joya producida
    const cantidadProducir = produccionData.cantidad_producida;
    console.log(`📈 Aumentando stock de joya en ${cantidadProducir} unidades...`);
    
    const { error: joyaUpdateError } = await supabase
      .from('jwl_joyas')
      .update({
        stock_actual: supabase.rpc('increment', { x: cantidadProducir })
      })
      .eq('id', produccionData.joya_id)
      .eq('business_id', businessId);

    if (joyaUpdateError) {
      console.log('⚠️  Error con RPC increment, intentando método alternativo...');
      // Intentar con una query más simple
      const { data: joyaActual, error: joyaSelectError } = await supabase
        .from('jwl_joyas')
        .select('stock_actual')
        .eq('id', produccionData.joya_id)
        .eq('business_id', businessId)
        .single();

      if (joyaSelectError) throw joyaSelectError;

      const nuevoStockJoya = joyaActual.stock_actual + cantidadProducir;
      console.log(`   Stock joya: ${joyaActual.stock_actual} → ${nuevoStockJoya}`);

      const { error: joyaUpdateError2 } = await supabase
        .from('jwl_joyas')
        .update({
          stock_actual: nuevoStockJoya
        })
        .eq('id', produccionData.joya_id)
        .eq('business_id', businessId);

      if (joyaUpdateError2) {
        console.error('❌ Error updating joya stock:', joyaUpdateError2);
        throw new Error('Error al actualizar stock de la joya');
      }
    }

    console.log('✅ Stock de joya actualizado correctamente');
    console.log('🎉 Producción creada exitosamente\n');

    return newData;
  } catch (error) {
    console.error('❌ Error in createProduccion:', error);
    throw error;
  }
}

export async function updateProduccion(
  id: string,
  data: Partial<JwlProduccionFormData>
): Promise<JwlProduccion> {
  const businessId = await getCurrentBusinessId();
  
  // Obtener la producción actual para revertir cambios en stock
  const { data: produccionActual, error: getError } = await supabase
    .from('jwl_produccion')
    .select('*, joya:jwl_joyas(*)')
    .eq('id', id)
    .eq('business_id', businessId)
    .single();

  if (getError) throw getError;

  try {
    // 1. Revertir el stock de la joya (restar la cantidad anterior)
    const { data: joyaActual, error: joyaSelectError } = await supabase
      .from('jwl_joyas')
      .select('stock_actual')
      .eq('id', produccionActual.joya_id)
      .eq('business_id', businessId)
      .single();

    if (joyaSelectError) throw joyaSelectError;

    const { error: joyaRevertError } = await supabase
      .from('jwl_joyas')
      .update({
        stock_actual: joyaActual.stock_actual - produccionActual.cantidad_producida
      })
      .eq('id', produccionActual.joya_id)
      .eq('business_id', businessId);

    if (joyaRevertError) throw joyaRevertError;

    // 2. Revertir el stock de materiales (devolver lo que se había rebajado)
    const { data: fichaCosto, error: fichaError } = await supabase
      .from('jwl_ficha_costo')
      .select(`
        *,
        materia_prima:jwl_materias_primas!inner(*)
      `)
      .eq('joya_id', produccionActual.joya_id)
      .eq('jwl_materias_primas.business_id', businessId);

    if (!fichaError && fichaCosto && fichaCosto.length > 0) {
      for (const item of fichaCosto) {
        const cantidadADevolver = item.cantidad_usada * produccionActual.cantidad_producida;
        
        const { error: updateError } = await supabase
          .from('jwl_materias_primas')
          .update({
            stock_actual: item.materia_prima.stock_actual + cantidadADevolver
          })
          .eq('id', item.materia_prima_id)
          .eq('business_id', businessId);

        if (updateError) throw updateError;
      }
    }

    // 3. Actualizar el registro de producción
    const { data: updatedData, error: updateError } = await supabase
      .from('jwl_produccion')
      .update(data)
      .eq('id', id)
      .eq('business_id', businessId)
      .select(`
        *,
        joya:jwl_joyas(*)
      `)
      .single();

    if (updateError) throw updateError;

    // 4. Aplicar los nuevos cambios de stock
    const nuevaCantidad = data.cantidad_producida || produccionActual.cantidad_producida;
    
    // Aumentar stock de joya con la nueva cantidad
    const { data: joyaNueva, error: joyaSelectError2 } = await supabase
      .from('jwl_joyas')
      .select('stock_actual')
      .eq('id', produccionActual.joya_id)
      .eq('business_id', businessId)
      .single();

    if (joyaSelectError2) throw joyaSelectError2;

    const { error: joyaUpdateError } = await supabase
      .from('jwl_joyas')
      .update({
        stock_actual: joyaNueva.stock_actual + nuevaCantidad
      })
      .eq('id', produccionActual.joya_id)
      .eq('business_id', businessId);

    if (joyaUpdateError) throw joyaUpdateError;

    // Rebajar materiales con la nueva cantidad
    if (!fichaError && fichaCosto && fichaCosto.length > 0) {
      for (const item of fichaCosto) {
        const cantidadARebajar = item.cantidad_usada * nuevaCantidad;
        
        const { error: updateError } = await supabase
          .from('jwl_materias_primas')
          .update({
            stock_actual: item.materia_prima.stock_actual - cantidadARebajar
          })
          .eq('id', item.materia_prima_id)
          .eq('business_id', businessId);

        if (updateError) throw updateError;
      }
    }

    return updatedData;
  } catch (error) {
    console.error('Error in updateProduccion:', error);
    throw error;
  }
}

export async function deleteProduccion(id: string): Promise<void> {
  const businessId = await getCurrentBusinessId();
  
  // Obtener la producción para revertir cambios en stock
  const { data: produccion, error: getError } = await supabase
    .from('jwl_produccion')
    .select('*, joya:jwl_joyas(*)')
    .eq('id', id)
    .eq('business_id', businessId)
    .single();

  if (getError) throw getError;

  try {
    // 1. Revertir el stock de la joya (restar la cantidad producida)
    const { data: joyaActual, error: joyaSelectError } = await supabase
      .from('jwl_joyas')
      .select('stock_actual')
      .eq('id', produccion.joya_id)
      .eq('business_id', businessId)
      .single();

    if (joyaSelectError) throw joyaSelectError;

    const { error: joyaUpdateError } = await supabase
      .from('jwl_joyas')
      .update({
        stock_actual: joyaActual.stock_actual - produccion.cantidad_producida
      })
      .eq('id', produccion.joya_id)
      .eq('business_id', businessId);

    if (joyaUpdateError) throw joyaUpdateError;

    // 2. Revertir el stock de materiales (devolver lo que se había rebajado)
    const { data: fichaCosto, error: fichaError } = await supabase
      .from('jwl_ficha_costo')
      .select(`
        *,
        materia_prima:jwl_materias_primas!inner(*)
      `)
      .eq('joya_id', produccion.joya_id)
      .eq('jwl_materias_primas.business_id', businessId);

    if (!fichaError && fichaCosto && fichaCosto.length > 0) {
      for (const item of fichaCosto) {
        const cantidadADevolver = item.cantidad_usada * produccion.cantidad_producida;
        
        const { error: updateError } = await supabase
          .from('jwl_materias_primas')
          .update({
            stock_actual: item.materia_prima.stock_actual + cantidadADevolver
          })
          .eq('id', item.materia_prima_id)
          .eq('business_id', businessId);

        if (updateError) throw updateError;
      }
    }

    // 3. Eliminar el registro de producción
    const { error: deleteError } = await supabase
      .from('jwl_produccion')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error in deleteProduccion:', error);
    throw error;
  }
}

// =====================================================
// VENTAS
// =====================================================

export async function getVentas(): Promise<JwlVenta[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_ventas')
    .select(`
      *,
      joya:jwl_joyas!inner(*)
    `)
    .eq('business_id', businessId)
    .order('fecha_venta', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getVentasByJoya(joyaId: string): Promise<JwlVenta[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_ventas')
    .select(`
      *,
      joya:jwl_joyas!inner(*)
    `)
    .eq('joya_id', joyaId)
    .eq('business_id', businessId)
    .order('fecha_venta', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createVenta(formData: JwlVentaFormData): Promise<JwlVenta> {
  const businessId = await getCurrentBusinessId();
  
  // Obtener el costo de producción actual de la joya
  const { data: joya, error: joyaError } = await supabase
    .from('jwl_joyas')
    .select('costo_produccion')
    .eq('id', formData.joya_id)
    .eq('business_id', businessId)
    .single();

  if (joyaError) throw joyaError;

  const { data: newData, error } = await supabase
    .from('jwl_ventas')
    .insert({
      ...formData,
      business_id: businessId,
      costo_unitario_al_vender: joya.costo_produccion
    })
    .select(`
      *,
      joya:jwl_joyas(*)
    `)
    .single();

  if (error) throw error;
  return newData;
}

export async function updateVenta(
  id: string,
  formData: Partial<JwlVentaFormData>
): Promise<JwlVenta> {
  const businessId = await getCurrentBusinessId();
  
  // Obtener la venta actual para revertir cambios en stock
  const { data: ventaActual, error: getError } = await supabase
    .from('jwl_ventas')
    .select('*, joya:jwl_joyas(*)')
    .eq('id', id)
    .eq('business_id', businessId)
    .single();

  if (getError) throw getError;

  try {
    // 1. Revertir el stock de la joya (devolver la cantidad vendida)
    const { data: joyaActual, error: joyaSelectError } = await supabase
      .from('jwl_joyas')
      .select('stock_actual')
      .eq('id', ventaActual.joya_id)
      .eq('business_id', businessId)
      .single();

    if (joyaSelectError) throw joyaSelectError;

    const { error: joyaRevertError } = await supabase
      .from('jwl_joyas')
      .update({
        stock_actual: joyaActual.stock_actual + ventaActual.cantidad
      })
      .eq('id', ventaActual.joya_id)
      .eq('business_id', businessId);

    if (joyaRevertError) throw joyaRevertError;

    // 2. Actualizar el registro de venta
    const { data: updatedData, error: updateError } = await supabase
      .from('jwl_ventas')
      .update(formData)
      .eq('id', id)
      .eq('business_id', businessId)
      .select(`
        *,
        joya:jwl_joyas(*)
      `)
      .single();

    if (updateError) throw updateError;

    // 3. Aplicar los nuevos cambios de stock
    const nuevaCantidad = formData.cantidad || ventaActual.cantidad;
    const joyaId = formData.joya_id || ventaActual.joya_id;
    
    // Rebajar stock de joya con la nueva cantidad
    const { data: joyaNueva, error: joyaSelectError2 } = await supabase
      .from('jwl_joyas')
      .select('stock_actual')
      .eq('id', joyaId)
      .eq('business_id', businessId)
      .single();

    if (joyaSelectError2) throw joyaSelectError2;

    const { error: joyaUpdateError } = await supabase
      .from('jwl_joyas')
      .update({
        stock_actual: joyaNueva.stock_actual - nuevaCantidad
      })
      .eq('id', joyaId)
      .eq('business_id', businessId);

    if (joyaUpdateError) throw joyaUpdateError;

    return updatedData;
  } catch (error) {
    console.error('Error in updateVenta:', error);
    throw error;
  }
}

export async function deleteVenta(id: string): Promise<void> {
  const businessId = await getCurrentBusinessId();
  
  // Obtener la venta para revertir cambios en stock
  const { data: venta, error: getError } = await supabase
    .from('jwl_ventas')
    .select('*, joya:jwl_joyas(*)')
    .eq('id', id)
    .eq('business_id', businessId)
    .single();

  if (getError) throw getError;

  try {
    // 1. Revertir el stock de la joya (devolver la cantidad vendida)
    const { data: joyaActual, error: joyaSelectError } = await supabase
      .from('jwl_joyas')
      .select('stock_actual')
      .eq('id', venta.joya_id)
      .eq('business_id', businessId)
      .single();

    if (joyaSelectError) throw joyaSelectError;

    const { error: joyaUpdateError } = await supabase
      .from('jwl_joyas')
      .update({
        stock_actual: joyaActual.stock_actual + venta.cantidad
      })
      .eq('id', venta.joya_id)
      .eq('business_id', businessId);

    if (joyaUpdateError) throw joyaUpdateError;

    // 2. Eliminar el registro de venta
    const { error: deleteError } = await supabase
      .from('jwl_ventas')
      .delete()
      .eq('id', id)
      .eq('business_id', businessId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error('Error in deleteVenta:', error);
    throw error;
  }
}

// =====================================================
// GASTOS GENERALES
// =====================================================

export async function getGastosGenerales(): Promise<JwlGastoGeneral[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_gastos_generales')
    .select('*')
    .eq('business_id', businessId)
    .order('fecha', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createGastoGeneral(data: JwlGastoGeneralFormData): Promise<JwlGastoGeneral> {
  const businessId = await getCurrentBusinessId();
  
  const { data: newData, error } = await supabase
    .from('jwl_gastos_generales')
    .insert({ ...data, business_id: businessId })
    .select()
    .single();

  if (error) throw error;
  return newData;
}

export async function deleteGastoGeneral(id: string): Promise<void> {
  const businessId = await getCurrentBusinessId();
  
  const { error } = await supabase
    .from('jwl_gastos_generales')
    .delete()
    .eq('id', id)
    .eq('business_id', businessId);

  if (error) throw error;
}

// =====================================================
// VISTAS Y REPORTES
// =====================================================

export async function getValorInventarioMateriales(): Promise<JwlValorInventarioMaterial[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_valor_inventario_materiales')
    .select('*')
    .eq('business_id', businessId)
    .order('valor_total', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getValorInventarioJoyas(): Promise<JwlValorInventarioJoya[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_valor_inventario_joyas')
    .select('*')
    .eq('business_id', businessId)
    .order('valor_costo', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getEstadisticasGenerales(): Promise<JwlEstadisticas> {
  const businessId = await getCurrentBusinessId();
  
  // Obtener conteos filtrados por business_id
  const [materialesCount, joyasCount, produccionesCount, ventasCount] = await Promise.all([
    supabase.from('jwl_materias_primas').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('jwl_joyas').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('jwl_produccion').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
    supabase.from('jwl_ventas').select('id', { count: 'exact', head: true }).eq('business_id', businessId)
  ]);

  // Obtener valores de inventario desde las vistas
  const [valorMateriales, valorJoyas] = await Promise.all([
    supabase.from('jwl_valor_inventario_materiales').select('valor_total').eq('business_id', businessId),
    supabase.from('jwl_valor_inventario_joyas').select('valor_costo').eq('business_id', businessId)
  ]);

  // Calcular ingresos totales (ventas)
  const { data: ventas } = await supabase
    .from('jwl_ventas')
    .select('cantidad, precio_unitario_venta, costo_unitario_al_vender')
    .eq('business_id', businessId);
  
  const ingresos_totales = ventas?.reduce((sum, v) => sum + ((v.cantidad || 0) * (v.precio_unitario_venta || 0)), 0) || 0;
  const costos_ventas = ventas?.reduce((sum, v) => sum + ((v.cantidad || 0) * (v.costo_unitario_al_vender || 0)), 0) || 0;

  // Calcular gastos totales (compras de materiales + gastos generales)
  const { data: compras } = await supabase
    .from('jwl_compras_materiales')
    .select('costo_total, jwl_materias_primas!inner(business_id)')
    .eq('jwl_materias_primas.business_id', businessId);
  
  const { data: gastos } = await supabase
    .from('jwl_gastos_generales')
    .select('monto')
    .eq('business_id', businessId);

  const gastos_materiales = compras?.reduce((sum, c) => sum + (c.costo_total || 0), 0) || 0;
  const gastos_generales = gastos?.reduce((sum, g) => sum + (g.monto || 0), 0) || 0;
  const gastos_totales = gastos_materiales + gastos_generales;

  const valor_inv_materiales = valorMateriales.data?.reduce((sum, m) => sum + (m.valor_total || 0), 0) || 0;
  const valor_inv_joyas = valorJoyas.data?.reduce((sum, j) => sum + (j.valor_costo || 0), 0) || 0;

  return {
    total_materiales: materialesCount.count || 0,
    total_joyas: joyasCount.count || 0,
    total_producciones: produccionesCount.count || 0,
    total_ventas: ventasCount.count || 0,
    valor_inventario_materiales: valor_inv_materiales,
    valor_inventario_joyas: valor_inv_joyas,
    ingresos_totales,
    gastos_totales,
    ganancia_neta: ingresos_totales - costos_ventas
  };
}

export async function getResumenVentasPorJoya(): Promise<JwlResumenVentasPorJoya[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_resumen_ventas_por_joya')
    .select('*')
    .eq('business_id', businessId)
    .order('ingresos_totales', { ascending: false });

  if (error) throw error;
  return data || [];
}

// =====================================================
// DASHBOARD STATS
// =====================================================

export async function getDashboardStats(): Promise<JwlDashboardStats> {
  const businessId = await getCurrentBusinessId();
  
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  // Valor inventario materiales
  const { data: inventarioMateriales } = await supabase
    .from('jwl_valor_inventario_materiales')
    .select('valor_total')
    .eq('business_id', businessId);
  
  const valorInventarioMateriales = inventarioMateriales?.reduce(
    (sum, item) => sum + (item.valor_total || 0), 
    0
  ) || 0;

  // Valor inventario joyas
  const { data: inventarioJoyas } = await supabase
    .from('jwl_valor_inventario_joyas')
    .select('valor_costo, valor_venta')
    .eq('business_id', businessId);
  
  const valorInventarioJoyasCosto = inventarioJoyas?.reduce(
    (sum, item) => sum + (item.valor_costo || 0), 
    0
  ) || 0;
  
  const valorInventarioJoyasVenta = inventarioJoyas?.reduce(
    (sum, item) => sum + (item.valor_venta || 0), 
    0
  ) || 0;

  // Ventas del mes
  const { data: ventasMes } = await supabase
    .from('jwl_ventas')
    .select('total_venta, cantidad, utilidad')
    .eq('business_id', businessId)
    .gte('fecha_venta', firstDayOfMonth)
    .lte('fecha_venta', lastDayOfMonth);

  const ventasMesTotal = ventasMes?.reduce(
    (sum, item) => sum + (item.total_venta || 0), 
    0
  ) || 0;
  
  const itemsVendidosMes = ventasMes?.reduce(
    (sum, item) => sum + (item.cantidad || 0), 
    0
  ) || 0;

  const utilidadMes = ventasMes?.reduce(
    (sum, item) => sum + (item.utilidad || 0), 
    0
  ) || 0;

  // Gastos en materiales del mes
  const { data: comprasMes } = await supabase
    .from('jwl_compras_materiales')
    .select('costo_total, jwl_materias_primas!inner(business_id)')
    .eq('jwl_materias_primas.business_id', businessId)
    .gte('fecha_compra', firstDayOfMonth)
    .lte('fecha_compra', lastDayOfMonth);

  const gastosMaterialesMes = comprasMes?.reduce(
    (sum, item) => sum + (item.costo_total || 0), 
    0
  ) || 0;

  // Gastos generales del mes
  const { data: gastosGeneralesMes } = await supabase
    .from('jwl_gastos_generales')
    .select('monto')
    .eq('business_id', businessId)
    .gte('fecha', firstDayOfMonth)
    .lte('fecha', lastDayOfMonth);

  const gastosGeneralesMesTotal = gastosGeneralesMes?.reduce(
    (sum, item) => sum + (item.monto || 0), 
    0
  ) || 0;

  // Calcular alertas de stock bajo manualmente
  const { data: materialesBajoStock } = await supabase
    .from('jwl_materias_primas')
    .select('id, stock_actual, stock_minimo')
    .eq('business_id', businessId);

  const alertasStockBajo = materialesBajoStock?.filter(
    m => m.stock_actual <= m.stock_minimo
  ).length || 0;

  return {
    valor_inventario_materiales: valorInventarioMateriales,
    valor_inventario_joyas_costo: valorInventarioJoyasCosto,
    valor_inventario_joyas_venta: valorInventarioJoyasVenta,
    ventas_mes: ventasMesTotal,
    items_vendidos_mes: itemsVendidosMes,
    gastos_materiales_mes: gastosMaterialesMes,
    gastos_generales_mes: gastosGeneralesMesTotal,
    utilidad_mes: utilidadMes,
    alertas_stock_bajo: alertasStockBajo
  };
}

// =====================================================
// REPORTES CON FILTROS DE FECHA
// =====================================================

export async function getReporteGastosMateriales(
  fechaInicio: string,
  fechaFin: string
): Promise<{ categoria: string; total: number }[]> {
  const businessId = await getCurrentBusinessId();
  
  const { data, error } = await supabase
    .from('jwl_compras_materiales')
    .select(`
      costo_total,
      materia_prima:jwl_materias_primas!inner(categoria, business_id)
    `)
    .eq('materia_prima.business_id', businessId)
    .gte('fecha_compra', fechaInicio)
    .lte('fecha_compra', fechaFin);

  if (error) throw error;

  // Agrupar por categoría
  const grouped = (data || []).reduce((acc: Record<string, number>, item: any) => {
    const categoria = item.materia_prima?.categoria || 'Sin categoría';
    acc[categoria] = (acc[categoria] || 0) + (item.costo_total || 0);
    return acc;
  }, {});

  return Object.entries(grouped).map(([categoria, total]) => ({
    categoria,
    total
  }));
}

export async function getReporteIngresos(
  fechaInicio: string,
  fechaFin: string
): Promise<{ categoria: string; total: number; utilidad: number }[]> {
  const businessId = await getCurrentBusinessId();

  const { data, error } = await supabase.rpc('jwl_reporte_ingresos', {
    p_business_id: businessId,
    p_fecha_inicio: fechaInicio,
    p_fecha_fin: fechaFin
  });

  if (error) throw error;
  return data || [];
}

// Reporte financiero (gastos por categoría de material)
export async function getReporteFinanciero(
  fechaInicio: string,
  fechaFin: string
): Promise<JwlReporteFinanciero[]> {
  console.log('💰 getReporteFinanciero - Inicio');
  console.log('  Fechas:', { fechaInicio, fechaFin });
  
  const businessId = await getCurrentBusinessId();
  console.log('  Business ID:', businessId);
  
  const { data, error } = await supabase
    .from('jwl_compras_materiales')
    .select(`
      cantidad,
      costo_unitario,
      jwl_materias_primas!inner(categoria, business_id)
    `)
    .eq('jwl_materias_primas.business_id', businessId)
    .gte('fecha_compra', fechaInicio)
    .lte('fecha_compra', fechaFin);

  console.log('  Query result:', { data, error });

  if (error) {
    console.error('  ❌ Error en query:', error);
    throw error;
  }

  // Agrupar por categoría
  const gastosPorCategoria = (data || []).reduce((acc: Record<string, number>, compra: any) => {
    const categoria = compra.jwl_materias_primas.categoria;
    const total = compra.cantidad * compra.costo_unitario;
    acc[categoria] = (acc[categoria] || 0) + total;
    return acc;
  }, {});

  const resultado = Object.entries(gastosPorCategoria).map(([categoria, total]) => ({
    categoria,
    total: total as number
  }));
  
  console.log('  ✅ Resultado final:', resultado);
  return resultado;
}

// Reporte de ventas (ingresos y utilidad por categoría de joya)
export async function getReporteVentas(
  fechaInicio: string,
  fechaFin: string
): Promise<JwlReporteVentas[]> {
  console.log('💵 getReporteVentas - Inicio');
  console.log('  Fechas:', { fechaInicio, fechaFin });
  
  const businessId = await getCurrentBusinessId();
  console.log('  Business ID:', businessId);
  
  const { data, error } = await supabase
    .from('jwl_ventas')
    .select(`
      cantidad,
      precio_unitario_venta,
      jwl_joyas!inner(
        categoria,
        costo_produccion,
        business_id
      )
    `)
    .eq('jwl_joyas.business_id', businessId)
    .gte('fecha_venta', fechaInicio)
    .lte('fecha_venta', fechaFin);

  console.log('  Query result:', { data, error });

  if (error) {
    console.error('  ❌ Error en query:', error);
    throw error;
  }

  // Agrupar por categoría
  const ventasPorCategoria = (data || []).reduce((acc: Record<string, { total: number; utilidad: number }>, venta: any) => {
    const categoria = venta.jwl_joyas.categoria;
    const ingresos = venta.cantidad * venta.precio_unitario_venta;
    const costos = venta.cantidad * venta.jwl_joyas.costo_produccion;
    const utilidad = ingresos - costos;

    if (!acc[categoria]) {
      acc[categoria] = { total: 0, utilidad: 0 };
    }
    acc[categoria].total += ingresos;
    acc[categoria].utilidad += utilidad;
    return acc;
  }, {});

  const resultado = Object.entries(ventasPorCategoria).map(([categoria, datos]) => ({
    categoria,
    total: datos.total,
    utilidad: datos.utilidad
  }));
  
  console.log('  ✅ Resultado final:', resultado);
  return resultado;
}

// Reporte de producción (resumen de ventas por joya)
export async function getReporteProduccion(
  fechaInicio: string,
  fechaFin: string
): Promise<JwlReporteProduccion[]> {
  console.log('🏭 getReporteProduccion - Inicio');
  console.log('  Fechas:', { fechaInicio, fechaFin });
  
  const businessId = await getCurrentBusinessId();
  console.log('  Business ID:', businessId);
  
  const { data, error } = await supabase
    .from('jwl_ventas')
    .select(`
      cantidad,
      precio_unitario_venta,
      jwl_joyas!inner(
        nombre,
        sku,
        categoria,
        costo_produccion,
        business_id
      )
    `)
    .eq('jwl_joyas.business_id', businessId)
    .gte('fecha_venta', fechaInicio)
    .lte('fecha_venta', fechaFin);

  console.log('  Query result:', { data, error });

  if (error) {
    console.error('  ❌ Error en query:', error);
    throw error;
  }

  // Agrupar por joya
  const ventasPorJoya = (data || []).reduce((acc: Record<string, any>, venta: any) => {
    const joya = venta.jwl_joyas;
    const key = joya.sku;

    if (!acc[key]) {
      acc[key] = {
        nombre: joya.nombre,
        sku: joya.sku,
        categoria: joya.categoria,
        total_ventas: 0,
        cantidad_vendida: 0,
        ingresos_totales: 0,
        utilidad_total: 0
      };
    }

    const ingresos = venta.cantidad * venta.precio_unitario_venta;
    const costos = venta.cantidad * joya.costo_produccion;
    const utilidad = ingresos - costos;

    acc[key].total_ventas += 1;
    acc[key].cantidad_vendida += venta.cantidad;
    acc[key].ingresos_totales += ingresos;
    acc[key].utilidad_total += utilidad;

    return acc;
  }, {});

  const resultado = Object.values(ventasPorJoya);
  console.log('  ✅ Resultado final:', resultado);
  return resultado;
}

// Reporte de inventario
export async function getReporteInventario(
  fechaInicio: string,
  fechaFin: string
): Promise<JwlReporteInventario[]> {
  const businessId = await getCurrentBusinessId();
  
  // Obtener materiales
  const { data: materiales, error: errorMateriales } = await supabase
    .from('jwl_materias_primas')
    .select('nombre, stock_actual, costo_unitario_actual')
    .eq('business_id', businessId);

  if (errorMateriales) throw errorMateriales;

  // Obtener joyas
  const { data: joyas, error: errorJoyas } = await supabase
    .from('jwl_joyas')
    .select('nombre, stock_actual, costo_produccion')
    .eq('business_id', businessId);

  if (errorJoyas) throw errorJoyas;

  const inventarioMateriales: JwlReporteInventario[] = (materiales || []).map(m => ({
    tipo: 'material' as const,
    nombre: m.nombre,
    cantidad: m.stock_actual,
    valor_unitario: m.costo_unitario_actual,
    valor_total: m.stock_actual * m.costo_unitario_actual
  }));

  const inventarioJoyas: JwlReporteInventario[] = (joyas || []).map(j => ({
    tipo: 'joya' as const,
    nombre: j.nombre,
    cantidad: j.stock_actual,
    valor_unitario: j.costo_produccion,
    valor_total: j.stock_actual * j.costo_produccion
  }));

  return [...inventarioMateriales, ...inventarioJoyas];
}

// Reporte de clientes (ventas agrupadas por cliente)
export async function getReporteClientes(
  fechaInicio: string,
  fechaFin: string
): Promise<{ cliente: string; total_ventas: number; cantidad_compras: number; total_gastado: number; utilidad_generada: number }[]> {
  console.log('👥 getReporteClientes - Inicio');
  console.log('  Fechas:', { fechaInicio, fechaFin });
  
  const businessId = await getCurrentBusinessId();
  console.log('  Business ID:', businessId);
  
  const { data, error } = await supabase
    .from('jwl_ventas')
    .select(`
      cliente,
      cantidad,
      precio_unitario_venta,
      jwl_joyas!inner(
        costo_produccion,
        business_id
      )
    `)
    .eq('jwl_joyas.business_id', businessId)
    .gte('fecha_venta', fechaInicio)
    .lte('fecha_venta', fechaFin);

  console.log('  Query result:', { data, error });

  if (error) {
    console.error('  ❌ Error en query:', error);
    throw error;
  }

  // Agrupar por cliente
  const ventasPorCliente = (data || []).reduce((acc: Record<string, any>, venta: any) => {
    const cliente = venta.cliente || 'Cliente sin nombre';

    if (!acc[cliente]) {
      acc[cliente] = {
        cliente,
        total_ventas: 0,
        cantidad_compras: 0,
        total_gastado: 0,
        utilidad_generada: 0
      };
    }

    const ingresos = venta.cantidad * venta.precio_unitario_venta;
    const costos = venta.cantidad * venta.jwl_joyas.costo_produccion;
    const utilidad = ingresos - costos;

    acc[cliente].total_ventas += 1;
    acc[cliente].cantidad_compras += venta.cantidad;
    acc[cliente].total_gastado += ingresos;
    acc[cliente].utilidad_generada += utilidad;

    return acc;
  }, {});

  const resultado = Object.values(ventasPorCliente).sort((a: any, b: any) => b.total_gastado - a.total_gastado);
  console.log('  ✅ Resultado final:', resultado);
  return resultado;
}

// =====================================================
// GESTIÓN DE MONEDAS
// =====================================================

/**
 * Obtener todas las monedas activas
 */
export async function getMonedas(): Promise<JwlMoneda[]> {
  const { data, error } = await supabase
    .from('jwl_monedas')
    .select('*')
    .eq('activo', true)
    .order('es_moneda_base', { ascending: false })
    .order('codigo');

  if (error) throw error;
  return data || [];
}

/**
 * Obtener la moneda configurada para un negocio
 */
export async function getMonedaNegocio(businessId: string): Promise<JwlMoneda | null> {
  try {
    const { data, error } = await supabase
      .from('jwl_configuracion_moneda')
      .select('moneda_id')
      .eq('business_id', businessId)
      .single();

    if (error || !data) {
      // Si no hay configuración, retornar moneda base
      const { data: monedaBase } = await supabase
        .from('jwl_monedas')
        .select('*')
        .eq('es_moneda_base', true)
        .single();
      
      return monedaBase;
    }

    // Obtener la moneda configurada
    const { data: moneda } = await supabase
      .from('jwl_monedas')
      .select('*')
      .eq('id', data.moneda_id)
      .single();

    return moneda || null;
  } catch (error) {
    console.error('Error en getMonedaNegocio:', error);
    // En caso de error, retornar moneda base
    const { data: monedaBase } = await supabase
      .from('jwl_monedas')
      .select('*')
      .eq('es_moneda_base', true)
      .single();
    
    return monedaBase;
  }
}

/**
 * Configurar la moneda para un negocio
 */
export async function setMonedaNegocio(businessId: string, monedaId: string): Promise<void> {
  // Validar que businessId no sea null o undefined
  if (!businessId) {
    throw new Error('businessId es requerido');
  }
  
  if (!monedaId) {
    throw new Error('monedaId es requerido');
  }

  console.log('setMonedaNegocio - businessId:', businessId, 'monedaId:', monedaId);

  const { error } = await supabase
    .from('jwl_configuracion_moneda')
    .upsert({
      business_id: businessId,
      moneda_id: monedaId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'business_id'
    });

  if (error) {
    console.error('Error en setMonedaNegocio:', error);
    throw error;
  }
}

/**
 * Actualizar tasa de cambio de una moneda (solo admin)
 */
export async function updateTasaCambio(monedaId: string, nuevaTasa: number): Promise<void> {
  const { error } = await supabase
    .from('jwl_monedas')
    .update({ tasa_cambio: nuevaTasa })
    .eq('id', monedaId);

  if (error) throw error;
}

/**
 * Convertir monto entre monedas
 */
export function convertirMoneda(
  monto: number,
  tasaOrigen: number,
  tasaDestino: number
): number {
  // Convertir a moneda base
  const montoBase = monto / tasaOrigen;
  // Convertir a moneda destino
  return montoBase * tasaDestino;
}

/**
 * Formatear monto con símbolo de moneda
 */
export function formatearMoneda(monto: number, moneda: JwlMoneda): string {
  // Para CLP usar formato europeo: punto para miles, coma para decimales
  if (moneda.codigo === 'CLP') {
    const tieneDecimales = monto % 1 !== 0;
    
    if (tieneDecimales) {
      // Formato: 100.000,20
      const montoFormateado = new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(monto);
      return `${moneda.simbolo}${montoFormateado}`;
    } else {
      // Formato: 755.000 (sin decimales)
      const montoFormateado = new Intl.NumberFormat('es-CL', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(monto);
      return `${moneda.simbolo}${montoFormateado}`;
    }
  }
  
  // Para otras monedas (USD, EUR) usar formato estándar con coma para miles
  const montoFormateado = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(monto);

  return `${moneda.simbolo}${montoFormateado}`;
}

// =====================================================
// CATÁLOGO DE MATERIALES (IA 3D)
// =====================================================

/**
 * Obtener catálogo de materiales de un negocio
 */
// ELIMINADO: Funciones del catálogo IA ya no se necesitan
// Las materias primas se gestionan directamente en jwl_materias_primas

