import Swal from 'sweetalert2';

/**
 * SweetAlert confirm box
 * @param {string} message - The confirmation message
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false otherwise
 */
export function ConfirmAlert(message) {
    return Swal.fire({
        title: 'Are you sure?',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        customClass: {
            confirmButton: 'btn btn-primary btn-hover',
            cancelButton: 'btn btn-danger btn-hover',
        },
        confirmButtonText: 'Continue',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        return result.isConfirmed;
    });
}