const webhookURL = 'https://discord.com/api/webhooks/1273985345746374669/FE7See8wWV6sminpaZBeyfJSWWYXUwZUtvlo9F73unouRMiLT9vKoCZQUXUwUPJSZYtA'; // Replace with your Discord Webhook URL
const supportAdmins = ['826204691859767307', 'ADMIN_DISCORD_ID_2']; // Replace with actual support admin Discord IDs
const currentUserID = 'CURRENT_USER_DISCORD_ID'; // Replace with actual current user Discord ID

let ticketCounter = localStorage.getItem('ticketCounter') || 17168769; // Initialize ticket counter from localStorage

// Initialize tickets display on page load
window.onload = function() {
    displayTickets();
};

// Event listener for ticket form submission
document.getElementById('ticket-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Increment ticket counter and generate a new ticket ID
    ticketCounter++;
    localStorage.setItem('ticketCounter', ticketCounter); // Save updated counter to localStorage
    const ticketID = `TICKET-${ticketCounter}`;

    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const issue = document.getElementById('issue').value;
    const submissionDate = new Date().toLocaleString(); // Get the current date and time

    // Create new ticket object
    const ticketData = {
        id: ticketID,
        name: name,
        email: email,
        issue: issue,
        status: 'Open',
        submissionDate: submissionDate,
        creatorID: currentUserID,
        adminID: supportAdmins[0] // Default to the first admin
    };

    // Save ticket data to localStorage
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    tickets.push(ticketData);
    localStorage.setItem('tickets', JSON.stringify(tickets));

    // Display the new ticket
    displayTickets();

    // Clear form fields
    document.getElementById('ticket-form').reset();

    // Send new ticket data to Discord
    sendUpdateToDiscord(ticketID, name, email, issue, 'Open', submissionDate);
});

// Function to delete a ticket
function deleteTicket(ticketID) {
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    tickets = tickets.filter(ticket => ticket.id !== ticketID);
    localStorage.setItem('tickets', JSON.stringify(tickets));

    // Refresh the ticket list
    displayTickets();

    // Send delete notification to Discord
    sendUpdateToDiscord(ticketID, '', '', '', 'Deleted', '');
}

// Function to resolve a ticket
function resolveTicket(ticketID) {
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    tickets = tickets.map(ticket => {
        if (ticket.id === ticketID) {
            ticket.status = 'Resolved';
        }
        return ticket;
    });
    localStorage.setItem('tickets', JSON.stringify(tickets));

    // Refresh the ticket list
    displayTickets();

    // Send resolve notification to Discord
    const ticket = tickets.find(ticket => ticket.id === ticketID);
    sendUpdateToDiscord(ticketID, ticket.name, ticket.email, ticket.issue, 'Resolved', ticket.submissionDate);
}

// Function to close a ticket
function closeTicket(ticketID) {
    let tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    tickets = tickets.map(ticket => {
        if (ticket.id === ticketID) {
            ticket.status = 'Closed';
        }
        return ticket;
    });
    localStorage.setItem('tickets', JSON.stringify(tickets));

    // Refresh the ticket list
    displayTickets();

    // Send close notification to Discord
    const ticket = tickets.find(ticket => ticket.id === ticketID);
    sendUpdateToDiscord(ticketID, ticket.name, ticket.email, ticket.issue, 'Closed', ticket.submissionDate);
}

// Function to display tickets
function displayTickets() {
    const ticketList = document.getElementById('ticket-list');
    ticketList.innerHTML = ''; // Clear existing tickets

    const tickets = JSON.parse(localStorage.getItem('tickets')) || [];
    tickets.forEach(ticket => {
        const ticketItem = document.createElement('li');
        ticketItem.className = 'ticket-item';
        ticketItem.innerHTML = `
            <h3>Ticket ID: ${ticket.id}</h3>
            <p>Name: ${ticket.name}</p>
            <p>Email: ${ticket.email}</p>
            <p>Issue: ${ticket.issue}</p>
            <p>Status: <span class="status">${ticket.status}</span></p>
            <p>Submitted Date: ${ticket.submissionDate}</p>
            <div class="ticket-actions">
                ${supportAdmins.includes(currentUserID) || currentUserID === ticket.creatorID ? `<button class="resolve-ticket-button" data-id="${ticket.id}">Resolve</button>` : ''}
                ${supportAdmins.includes(currentUserID) || currentUserID === ticket.creatorID ? `<button class="close-ticket-button" data-id="${ticket.id}">Close</button>` : ''}
                ${supportAdmins.includes(currentUserID) || currentUserID === ticket.creatorID ? `<button class="delete-ticket-button" data-id="${ticket.id}">Delete</button>` : ''}
            </div>
            <div class="message-history" style="display: ${supportAdmins.includes(currentUserID) || currentUserID === ticket.creatorID ? 'block' : 'none'};"></div>
            <div class="message-area" style="display: ${supportAdmins.includes(currentUserID) || currentUserID === ticket.creatorID ? 'block' : 'none'};">
                <textarea class="message-input" placeholder="Type your message here..." rows="3"></textarea>
                <button class="send-message-button" data-id="${ticket.id}">Send Message</button>
            </div>
        `;
        ticketList.appendChild(ticketItem);

        // Add event listeners for actions
        const resolveButton = ticketItem.querySelector('.resolve-ticket-button');
        const closeButton = ticketItem.querySelector('.close-ticket-button');
        const deleteButton = ticketItem.querySelector('.delete-ticket-button');
        const sendMessageButton = ticketItem.querySelector('.send-message-button');

        if (resolveButton) {
            resolveButton.addEventListener('click', function() {
                resolveTicket(ticket.id);
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', function() {
                closeTicket(ticket.id);
            });
        }

        if (deleteButton) {
            deleteButton.addEventListener('click', function() {
                deleteTicket(ticket.id);
            });
        }

        if (sendMessageButton) {
            sendMessageButton.addEventListener('click', function() {
                const messageInput = ticketItem.querySelector('.message-input');
                const message = messageInput.value.trim();
                if (message) {
                    // Add message to message history
                    const messageElement = document.createElement('div');
                    messageElement.className = 'message';
                    messageElement.textContent = `${currentUserID === ticket.creatorID ? 'You' : 'Admin'}: ${message}`;
                    const messageHistory = ticketItem.querySelector('.message-history');
                    messageHistory.appendChild(messageElement);

                    // Send message to Discord
                    sendMessageToDiscord(ticket.id, ticket.name, ticket.email, ticket.issue, message, new Date().toLocaleString());

                    // Clear message input
                    messageInput.value = '';
                } else {
                    alert('Message cannot be empty.');
                }
            });
        }
    });
}

// Function to send ticket updates to Discord
function sendUpdateToDiscord(ticketID, name, email, issue, status, submissionDate) {
    const payload = {
        username: 'Support Ticket Bot',
        embeds: [{
            title: 'Support Ticket Update',
            fields: [
                { name: 'Ticket ID', value: ticketID, inline: true },
                { name: 'Name', value: name, inline: true },
                { name: 'Email', value: email, inline: true },
                { name: 'Issue', value: issue },
                { name: 'Status', value: status },
                { name: 'Submitted Date', value: submissionDate }
            ],
            color: status === 'Deleted' ? 0xff0000 : (status === 'Closed' ? 0x0000ff : 0x00ff00) // Red for deleted, blue for closed, green for others
        }]
    };

    fetch(webhookURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(response => {
        if (response.ok) {
            console.log(`Ticket ${status === 'Deleted' ? 'deleted' : (status === 'Closed' ? 'closed' : 'updated')} in Discord`);
        } else {
            console.error('Failed to log ticket update to Discord');
        }
    }).catch(error => {
        console.error('Error:', error);
    });
}

// Function to send messages to Discord
function sendMessageToDiscord(ticketID, name, email, issue, message, messageDate) {
    const payload = {
        username: 'Support Ticket Bot',
        embeds: [{
            title: `Message for Ticket ${ticketID}`,
            fields: [
                { name: 'Name', value: name, inline: true },
                { name: 'Email', value: email, inline: true },
                { name: 'Issue', value: issue },
                { name: 'Message', value: message },
                { name: 'Date', value: messageDate }
            ],
            color: 0x00ff00
        }]
    };

    fetch(webhookURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(response => {
        if (response.ok) {
            console.log(`Message sent to Discord for Ticket ${ticketID}`);
        } else {
            console.error('Failed to send message to Discord');
        }
    }).catch(error => {
        console.error('Error:', error);
    });
}
