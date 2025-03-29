// components/Advertisement.js
import React from 'react';
import PropTypes from 'prop-types';

// interface AdvertisementProps {
//   title: string;
//   description: string;
//   imageUrl: string;
//   link: string;
// }

const Advertisement = ({ title, description, imageUrl, link }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <img src={imageUrl} alt={title} className="w-full h-48 object-cover" />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <a
          href={link}
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Ver más
        </a>
      </div>
    </div>
  );
};

Advertisement.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  imageUrl: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired
};

export default Advertisement;