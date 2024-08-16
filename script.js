const webhookURL = 'https://discord.com/api/webhooks/1273985345746374669/FE7See8wWV6sminpaZBeyfJSWWYXUwZUtvlo9F73unouRMiLT9vKoCZQUXUwUPJSZYtA'; // Replace with your Discord Webhook URL
const supportAdmins = ['826204691859767307', 'ADMIN_DISCORD_ID_2']; // Replace with actual support admin Discord IDs
const currentUserID = 'CURRENT_USER_DISCORD_ID'; // Replace with actual current user Discord ID

let ticketCounter = 17000000; // Initialize ticket counter

document.getElementById('ticket-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Increment ticket counter and generate a new ticket ID
    ticketCounter++;
    const ticketID = `TICKET-${ticketCounter}`;

    // Get form values
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const issue = document.getElementById('issue').value;
    const submissionDate = new Date().toLocaleString(); // Get the current date and time

    // Create new ticket element
    const ticketItem = document.createElement('li');
    ticketItem.className = 'ticket-item';
    ticketItem.innerHTML = `
        <h3>Ticket ID: <span class="ticket-id">${ticketID}</span> - Ticket from ${name}</h3>
        <p>Email: <span class="ticket-email">${email}</span></p>
        <p>Issue: ${issue}</p>
        <p>Status: <span class="status">Open</span></p>
        <p>Submitted Date: ${submissionDate}</p>
        <p class="ticket-creator-id" style="display: none;">${currentUserID}</p>
        <p class="admin-id" style="display: none;">${supportAdmins[0]}</p>
        <div class="message-history" style="display: none;"></div>
        <div class="message-area" style="display: none;">
            <textarea class="message-input" placeholder="Type your message here..." rows="3"></textarea>
            <button class="send-message-button">Send Message</button>
        </div>
    `;

    // Show message area if the current user is the ticket creator or admin assigned
    const messageArea = ticketItem.querySelector('.message-area');
    const messageHistory = ticketItem.querySelector('.message-history');
    const ticketCreatorID = ticketItem.querySelector('.ticket-creator-id').textContent;
    const ticketAdminID = ticketItem.querySelector('.admin-id').textContent;

    if (supportAdmins.includes(currentUserID) || currentUserID === ticketCreatorID || currentUserID === ticketAdminID) {
        messageArea.style.display = 'block';
        messageHistory.style.display = 'block';
    } else {
        messageArea.style.display = 'none';
        messageHistory.style.display = 'none';
    }

    // Create resolve button
    const resolveButton = document.createElement('button');
    resolveButton.className = 'resolve-button';
    resolveButton.textContent = 'Resolve';
    resolveButton.addEventListener('click', function() {
        const statusElement = ticketItem.querySelector('.status');
        const isResolved = statusElement.textContent === 'Resolved';
        statusElement.textContent = isResolved ? 'Open' : 'Resolved';
        ticketItem.classList.toggle('resolved');
        resolveButton.textContent = isResolved ? 'Resolve' : 'Resolved';
        // Update the ticket status on Discord
        sendUpdateToDiscord(ticketID, name, email, issue, statusElement.textContent, submissionDate);
    });

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', function() {
        const statusElement = ticketItem.querySelector('.status');
        if (supportAdmins.includes(currentUserID) || currentUserID === ticketCreatorID) {
            // Change ticket status to closed
            statusElement.textContent = 'Closed';
            ticketItem.classList.add('closed');
            closeButton.style.display = 'none'; // Hide close button after ticket is closed
            // Update the ticket status on Discord
            sendUpdateToDiscord(ticketID, name, email, issue, 'Closed', submissionDate);
        } else {
            alert('You are not authorized to close this ticket.');
        }
    });

    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-button';
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', function() {
        const ticketCreatorID = ticketItem.querySelector('.ticket-creator-id').textContent;
        if (supportAdmins.includes(currentUserID) || currentUserID === ticketCreatorID) {
            // Remove the ticket item
            ticketItem.remove();
            // Send delete notification to Discord
            sendUpdateToDiscord(ticketID, name, email, issue, 'Deleted', submissionDate);
        } else {
            alert('You are not authorized to delete this ticket.');
        }
    });

    // Create send message button
    const sendMessageButton = ticketItem.querySelector('.send-message-button');
    sendMessageButton.addEventListener('click', function() {
        const messageInput = ticketItem.querySelector('.message-input');
        const message = messageInput.value.trim();
        if (message && (supportAdmins.includes(currentUserID) || currentUserID === ticketCreatorID)) {
            // Add message to message history
            const messageElement = document.createElement('div');
            messageElement.className = 'message';
            messageElement.textContent = `${currentUserID === ticketCreatorID ? 'You' : 'Admin'}: ${message}`;
            messageHistory.appendChild(messageElement);

            // Send message to Discord
            sendMessageToDiscord(ticketID, name, email, issue, message, new Date().toLocaleString());

            // Clear message input
            messageInput.value = '';
        } else {
            alert('You are not authorized to send messages for this ticket.');
        }
    });

    // Append buttons to ticket item
    ticketItem.appendChild(resolveButton);
    ticketItem.appendChild(closeButton);
    ticketItem.appendChild(deleteButton);

    // Add ticket to list
    document.getElementById('ticket-list').appendChild(ticketItem);

    // Clear form fields
    document.getElementById('ticket-form').reset();

    // Send new ticket data to Discord
    sendUpdateToDiscord(ticketID, name, email, issue, 'Open', submissionDate);
});

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
            title: 'New Message in Support Ticket',
            fields: [
                { name: 'Ticket ID', value: ticketID, inline: true },
                { name: 'Name', value: name, inline: true },
                { name: 'Email', value: email, inline: true },
                { name: 'Issue', value: issue },
                { name: 'Message', value: message },
                { name: 'Date', value: messageDate }
            ],
            color: 0x00ff00 // Green for new messages
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
            console.log('Message logged to Discord');
        } else {
            console.error('Failed to log message to Discord');
        }
    }).catch(error => {
        console.error('Error:', error);
    });
}
