import cron from "node-cron"
import { Job } from "../models/jobSchema.js"
import { User } from "../models/userSchema.js"
import { sendEmail } from "../utils/sendEmail.js"

// Extend existing Job schema with new fields
Job.schema.add({
    newsletterEmailsSent: {
        type: [String], // Store email addresses of users who received newsletter
        default: []
    },
    lastNewsletterSentAt: {
        type: Date,
        default: null
    }
});

export const newsLetterCron = () => {
    cron.schedule("0 */1 * * *", async () => {
        console.log("Running Newsletter Cron Automation")
        
        try {
            const jobs = await Job.find({
                // Only send newsletter for jobs not sent in the last 7 days
                $or: [
                    { lastNewsletterSentAt: null },
                    { lastNewsletterSentAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
                ]
            });
            
            for (const job of jobs) {
                // Find users whose niches match the job's niche
                const filteredUsers = await User.find({
                    $or: [
                        {"niches.firstNiche": job.niche},
                        {"niches.secondNiche": job.niche},
                        {"niches.thirdNiche": job.niche}
                    ],
                    email: { $nin: job.newsletterEmailsSent || [] } // Avoid sending to users already emailed
                }).limit(50); // Batch limit to 50 users per run

                // Track failed emails
                const failedEmails = [];

                // Send email to each matching user with rate limiting
                for (const user of filteredUsers) {
                    try {
                        const subject = `Apply Now: ${job.title} Opportunity in ${job.niche} - Join ${job.companyName}!`;

                        const message = `
                        Hello ${user.name},

                        Exciting job opportunity from ${job.companyName}!

                        Job Details:
                        - **Position**: ${job.title}
                        - **Salary**: ${job.salary}
                        - **Location**: ${job.location.join(", ")}
                        - **Job Type**: ${job.jobType}

                        Job Description:
                        ${job.shortDescription}

                        Required Skills:
                        ${job.skills.map(skill => `- ${skill}`).join("\n")}

                        Apply Now: ${job.applyLink}

                        Don't miss this chance to advance your career in the ${job.niche} industry!

                        Best regards,
                        The Hiring Team
                        `;

                        await sendEmail({
                            email: user.email,
                            subject,
                            message
                        });

                        // Track sent emails
                        job.newsletterEmailsSent.push(user.email);
                    } catch (emailError) {
                        console.error(`Failed to send email to ${user.email}:`, emailError);
                        failedEmails.push({
                            email: user.email,
                            error: emailError.message
                        });
                    }

                    // Add a small delay between emails to reduce load
                    await new Promise(resolve => setTimeout(resolve, 200));
                }

                // Update job with sent emails and timestamp
                job.lastNewsletterSentAt = new Date();
                await job.save();

                // Log failed emails (optional: you might want to implement more sophisticated logging)
                if (failedEmails.length > 0) {
                    console.error('Failed Email Sends:', failedEmails);
                }
            }

            console.log("Newsletter emails sent successfully");
        } catch (error) {
            console.error("Error in newsletter cron job:", error);
            // Optionally, send an alert or log to a monitoring service
        }
    });
}

// Optional: Add a cleanup job to remove old email tracking
export const cleanupNewsletterTracking = () => {
    cron.schedule("0 0 1 * *", async () => { // Run monthly
        try {
            await Job.updateMany(
                { lastNewsletterSentAt: { $lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
                { 
                    $set: { 
                        newsletterEmailsSent: [],
                        lastNewsletterSentAt: null 
                    }
                }
            );
            console.log("Newsletter tracking cleaned up");
        } catch (error) {
            console.error("Error in newsletter tracking cleanup:", error);
        }
    });
}