/**
 * Importaciones globales para compatibilidad con el código existente
 */
import { fabric } from 'fabric';
import { jsPDF } from 'jspdf';
import Swal from 'sweetalert2';

// Exponer fabric como variable global para compatibilidad
window.fabric = fabric;

// Exponer jsPDF como variable global para compatibilidad
window.jspdf = { jsPDF };

// Exponer Swal como variable global para compatibilidad
window.Swal = Swal;

// Exportar para uso en imports
export { fabric, jsPDF, Swal };
export default { fabric, jsPDF, Swal }; 