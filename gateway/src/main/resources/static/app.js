document.addEventListener('DOMContentLoaded', () => {
    const workoutForm = document.getElementById('workoutForm');
    const workoutsList = document.getElementById('workoutsList');
    const workoutIdField = document.getElementById('workoutId');
    const nameField = document.getElementById('name');
    const descriptionField = document.getElementById('description');
    const durationMinutesField = document.getElementById('durationMinutes');
    const difficultyLevelField = document.getElementById('difficultyLevel');
    const clearFormButton = document.getElementById('clearFormButton');
    const logoutButton = document.getElementById('logoutButton');

    let csrfToken = null;
    let csrfHeaderName = null;

    // Function to get CSRF token from cookie
    const getCsrfTokenFromCookie = () => {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') { // Default cookie name by Spring Security
                return decodeURIComponent(value);
            }
        }
        return null;
    };
    
    // Function to get CSRF header name (can be fetched if server sends it, or assume default)
    // For this exercise, we'll assume the common 'X-XSRF-TOKEN' header.
    // Spring Security's CookieCsrfTokenRepository + XorCsrfTokenRequestAttributeHandler uses 'X-XSRF-TOKEN'
    const getCsrfHeaderName = () => 'X-XSRF-TOKEN';


    // Initialize CSRF token and header
    const initializeCsrf = () => {
        csrfToken = getCsrfTokenFromCookie();
        csrfHeaderName = getCsrfHeaderName();
        if (!csrfToken || !csrfHeaderName) {
            console.warn('CSRF token or header name not found. Form submissions might fail.');
            // Potentially fetch it from a dedicated endpoint if not in cookie, but Spring's setup should provide it.
        }
    };
    
    initializeCsrf(); // Call on load

    const apiBaseUrl = '/api/workouts';

    // Fetch all workouts
    const fetchWorkouts = async () => {
        try {
            const response = await fetch(apiBaseUrl);
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    // If unauthorized, the browser should have been redirected to login by Spring Security.
                    // If the SPA is loaded, it means user is authenticated or it's a public page.
                    // This check is more for API errors after authentication.
                    console.error('Unauthorized or Forbidden fetching workouts.');
                    alert('Error fetching workouts: Session may have expired. Please try refreshing.');
                    // window.location.reload(); // Or redirect to login page
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const workouts = await response.json();
            renderWorkouts(workouts);
        } catch (error) {
            console.error('Error fetching workouts:', error);
            workoutsList.innerHTML = '<li>Error loading workouts. Please try again later.</li>';
        }
    };

    // Render workouts in the list
    const renderWorkouts = (workouts) => {
        workoutsList.innerHTML = ''; // Clear existing list
        if (workouts.length === 0) {
            workoutsList.innerHTML = '<li>No workouts found. Add one above!</li>';
            return;
        }
        workouts.forEach(workout => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="details">
                    <strong>${workout.name}</strong> (${workout.difficultyLevel}, ${workout.durationMinutes} mins)
                    <p>${workout.description || 'No description'}</p>
                </div>
                <div class="actions">
                    <button class="edit-btn" data-id="${workout.id}">Edit</button>
                    <button class="delete-btn" data-id="${workout.id}">Delete</button>
                </div>
            `;
            workoutsList.appendChild(li);
        });
    };

    // Handle form submission (Add/Update)
    workoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        initializeCsrf(); // Re-initialize CSRF token before each submission

        if (!csrfToken || !csrfHeaderName) {
            alert('CSRF token not available. Cannot submit form.');
            return;
        }

        const id = workoutIdField.value;
        const workoutData = {
            name: nameField.value,
            description: descriptionField.value,
            durationMinutes: parseInt(durationMinutesField.value),
            difficultyLevel: difficultyLevelField.value,
        };

        const method = id ? 'PUT' : 'POST';
        const url = id ? `${apiBaseUrl}/${id}` : apiBaseUrl;

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    [csrfHeaderName]: csrfToken 
                },
                body: JSON.stringify(workoutData)
            });

            if (!response.ok) {
                 if (response.status === 401 || response.status === 403) {
                    alert('Operation failed: Unauthorized or Forbidden. Your session might have expired.');
                    window.location.reload(); // Force reload, may trigger login
                    return;
                }
                const errorData = await response.json().catch(() => ({ message: 'Unknown error occurred.' }));
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
            }
            
            clearForm();
            fetchWorkouts(); // Refresh list
        } catch (error) {
            console.error('Error saving workout:', error);
            alert(`Error saving workout: ${error.message}`);
        }
    });

    // Handle clicks on workout list (for Edit/Delete buttons)
    workoutsList.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const response = await fetch(`${apiBaseUrl}/${id}`);
            const workout = await response.json();
            populateForm(workout);
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Are you sure you want to delete this workout?')) {
                initializeCsrf(); // Re-initialize CSRF token
                if (!csrfToken || !csrfHeaderName) {
                    alert('CSRF token not available. Cannot delete.');
                    return;
                }
                try {
                    const response = await fetch(`${apiBaseUrl}/${id}`, { 
                        method: 'DELETE',
                        headers: {
                            [csrfHeaderName]: csrfToken
                        }
                    });
                    if (!response.ok) {
                        if (response.status === 401 || response.status === 403) {
                            alert('Delete failed: Unauthorized or Forbidden. Your session might have expired.');
                            window.location.reload();
                            return;
                        }
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    fetchWorkouts(); // Refresh list
                } catch (error) {
                    console.error('Error deleting workout:', error);
                    alert('Error deleting workout.');
                }
            }
        }
    });

    // Populate form for editing
    const populateForm = (workout) => {
        workoutIdField.value = workout.id;
        nameField.value = workout.name;
        descriptionField.value = workout.description || '';
        durationMinutesField.value = workout.durationMinutes;
        difficultyLevelField.value = workout.difficultyLevel;
    };

    // Clear form
    const clearForm = () => {
        workoutIdField.value = '';
        workoutForm.reset();
    };
    clearFormButton.addEventListener('click', clearForm);

    // Handle logout
    logoutButton.addEventListener('click', () => {
        // Spring Security's logout handler is at /logout by default
        // We need to POST to it, and include CSRF token
        initializeCsrf();
        if (!csrfToken || !csrfHeaderName) {
            // Fallback to simple GET if CSRF not found, though POST is preferred for logout
            console.warn("CSRF token not found for logout, attempting GET logout.");
            window.location.href = '/logout'; // This might work if GET logout is enabled (not default)
            return;
        }

        fetch('/logout', {
            method: 'POST',
            headers: {
                [csrfHeaderName]: csrfToken
            }
        }).then(response => {
            // After logout, Spring Security should redirect to the logoutSuccessUrl (e.g., '/')
            // or the login page if session is invalidated.
            // We just need to make sure the browser navigates away or reloads.
            if (response.ok || response.redirected) {
                window.location.href = '/'; // Redirect to home, which should trigger login if session is gone
            } else {
                // If POST logout fails, try a GET as a fallback
                console.error('POST logout failed, trying GET.');
                window.location.href = '/logout'; 
            }
        }).catch(error => {
            console.error('Error during logout:', error);
            // Fallback to GET logout on error
            window.location.href = '/logout';
        });
    });

    // Initial fetch of workouts
    fetchWorkouts();
});
