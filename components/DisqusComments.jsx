'use client';
import { DiscussionEmbed } from 'disqus-react';

export default function DisqusComments({ url, identifier, title }) {
  // Ya puse tu shortname real: animeonline-3
  const disqusShortname = "animeonline-3"; 
  
  const disqusConfig = {
    url: url,
    identifier: identifier,
    title: title,
    language: 'es_MX' 
  };

  return (
    <div className="mt-10 bg-[#1c1b22] p-4 md:p-8 rounded-xl border border-gray-800 shadow-2xl">
      <h3 className="text-xl font-bold mb-6 text-white border-b border-gray-800 pb-2 flex items-center gap-2">
        <span className="text-pink-500">💬</span> Comentarios de la Comunidad
      </h3>
      <DiscussionEmbed
        shortname={disqusShortname}
        config={disqusConfig}
      />
    </div>
  );
}