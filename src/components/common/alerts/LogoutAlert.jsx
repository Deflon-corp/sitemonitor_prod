import Swal from 'sweetalert2';

/**
 * Session Expired Alert
 * Displays a blocking modal to inform the user that their session has ended.
 * @returns {Promise<void>} - Resolves when the user clicks the "Log In" button.
 */
export const LogoutAlert = () => {
    return Swal.fire({
        title: 'Session Expired',
        text: 'Your session has expired. Please log in again to continue.',
        icon: 'warning',
        showCancelButton: false,
        confirmButtonColor: '#3085d6',
        confirmButtonText: 'Log In',
        allowOutsideClick: false,
        allowEscapeKey: false,
        customClass: {
            confirmButton: 'btn btn-primary btn-hover px-4',
        },
    });
};
