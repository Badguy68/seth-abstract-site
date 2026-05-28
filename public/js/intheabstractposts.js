const CURRENT_ABSTRACT_WEEK = "week-001";

const ABSTRACT_POSTS = {
  "week-001": {
    weekNumber: "001",
    updated: "May 29, 2026",
    witnessCount: "12",

    currentListening: {
      title: "I Know The End",
      artist: "Phoebe Bridgers",
      cover: "/intheabstract/media/album_cover.jpg"
    },

    fragment: "Some doors only open after you stop looking for them.",

    blogHtml: `
      <h3>The first transmission</h3>

      <p>
        This is where the weekly dispatch will go. It can be personal, strange,
        direct, poetic, or practical depending on what happened that week.
      </p>

      <p>
        You can include images inside the blog whenever they actually matter.
      </p>

      <figure>
        <img src="/images/abstract/example-blog-image.jpg" alt="Studio process image">
        <figcaption>A small piece of the process.</figcaption>
      </figure>

      <p>
        This page will change every Sunday. Some things here may become public.
        Some may only exist here for a week.
      </p>
    `,

    voices: {
      thought: "I think old poems feel alive because grief keeps changing shape.",
      poem: `
        <p>There was a room behind the rain,</p>
        <p>and in it, someone spoke my name.</p>
      `,
      artwork: "/images/abstract/community-art-001.jpg",
      artworkCaption: "Anonymous witness"
    }
  }
};