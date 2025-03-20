# Robot Waiter Client-Server Simulation

## Project Overview
This project simulates the interaction between Helbling's robot waiter and a group of customers ordering at a table. The system is designed using a client-server architecture to provide a seamless and personalized ordering experience.

## Interaction Flow
1. The robot arrives at the table and displays a QR code.
2. A customer scans the QR code with their device.
3. The robot retrieves the customer’s data while the group begins ordering, enabling a personalized experience (yes, you can order "the usual" 😉).
4. The system identifies individual customers based on their speech using noise cancellation and contextual analysis (explained below).
5. Once the customer completes their order, the robot updates the user profile with the latest information.

## Noise Cancellation
The noise cancellation process consists of three phases:
1. **Noise Sample Extraction**: A representative segment of background noise is identified, either adaptively (by selecting quieter parts of the signal) or using a fixed time window. This segment serves as the noise profile.
2. **Noise Reduction Processing**: The algorithm analyzes the noise profile and subtracts it from the overall signal, isolating the main audio features while reducing unwanted noise.
3. **Amplification and Clipping**: The cleaned signal is amplified with a gain factor, and any peaks exceeding the normalized range are clipped to prevent distortion.

## Voice Labelling
Voice labeling is achieved by understanding the context of the conversation and matching the customer's known preferences with the speech transcript. This helps the system identify and differentiate individual speakers, ensuring accurate order processing.

## Technologies Used
- **Client-Server Architecture** for communication between the robot and customer devices.
- **Speech Recognition & Processing** for order identification.
- **Noise Cancellation Algorithms** to improve speech clarity in a restaurant environment.
- **Context-Aware AI** for personalized customer interaction.

## Future Enhancements
- **Multilingual Support** for diverse customer interactions.
- **Facial Recognition Integration** to further enhance user identification.
- **Expanded Order Customization** to refine personalization.

## Contributors
This project is developed by "P&P s.r.l.".

