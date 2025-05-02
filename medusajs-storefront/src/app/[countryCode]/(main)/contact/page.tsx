import Divider from "@modules/common/components/divider"
import React from "react"

const ContactPage = () => {
  return (
    <div className="py-12 content-container">
      <h1 className="text-2xl font-semibold mb-6">Contact Us</h1>

      <div className="space-y-4">
        <Divider></Divider>

        <div>
          <p>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:info@bntbng.com"
              className="text-blue-500"
            >
              info@bntbng.com
            </a>
          </p>
        </div>

        <div>
          <p>
            <strong>Phone:</strong>{" "}
            <a href="tel:+14163680023" className="text-blue-500">
              416-368-0023
            </a>
          </p>
        </div>

        <div>
          <p>
            <strong>Address:</strong> 2800 John Street Unit 5, Markham, Ontario,
            L3R 0E2, Canada
          </p>
        </div>

        {/* Embedded Google Map */}
        <div className="mt-6">
          <h2 className="text-lg font-medium">Find us on the map:</h2>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2886.615213378065!2d-79.35896882493886!3d43.83359527911514!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882b2f08c07f09d3%3A0x94fef1f1b5e0f911!2s2800%20John%20St%2C%20Markham%2C%20ON%20L3R%200E2%2C%20Canada!5e0!3m2!1sen!2sus!4v1695055878723!5m2!1sen!2sus"
            width="50%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
