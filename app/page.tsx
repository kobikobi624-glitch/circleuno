"use client";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    try {
      await fetch("https://api.sheetbest.com/sheets/d7e6ef07-6d28-45fe-9818-faa91595fbda", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Email: email,
          Date: new Date().toLocaleString(),
        }),
      });

      setSubmitted(true);
      setEmail("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white text-gray-900">

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6">

        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          Meet new people.
          <br />
          Build real connections.
        </h1>

        <p className="text-xl md:text-2xl text-gray-600 max-w-xl mb-8">
          CircleUno is a safe place to talk with strangers,
          have meaningful conversations, and build real friendships.
        </p>

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="px-4 py-3 rounded-lg border border-gray-300 w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Join Early Access
            </button>
          </form>
        ) : (
          <p className="mt-4 text-green-600 font-medium">
            Thanks! We'll notify you 🚀
          </p>
        )}

      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 bg-gray-50 text-center">

        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          How it works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">
              Create your profile
            </h3>
            <p className="text-gray-600">
              Tell us about your interests and who you'd like to talk with.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">
              Start a conversation
            </h3>
            <p className="text-gray-600">
              Get instantly matched with someone new.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border">
            <h3 className="text-xl font-semibold mb-3">
              Build your circle
            </h3>
            <p className="text-gray-600">
              Add people you enjoyed talking with and stay connected.
            </p>
          </div>

        </div>

      </section>

      {/* FEATURES */}
      <section className="py-20 px-6 text-center">

        <h2 className="text-3xl md:text-4xl font-bold mb-12">
          Why CircleUno?
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

          <div>
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold mb-2">
              Safe & Moderated
            </h3>
            <p className="text-gray-600">
              No toxic behavior. Real people. Real identities.
            </p>
          </div>

          <div>
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-semibold mb-2">
              Meaningful Conversations
            </h3>
            <p className="text-gray-600">
              Designed to go deeper than small talk.
            </p>
          </div>

          <div>
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-semibold mb-2">
              Meet People Worldwide
            </h3>
            <p className="text-gray-600">
              Expand your circle beyond your city.
            </p>
          </div>

        </div>

      </section>

      {/* CTA BOTTOM */}
      <section className="py-20 px-6 text-center bg-gray-100">

        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to meet new people?
        </h2>

        <p className="text-gray-600 mb-8">
          Join early and be among the first to experience CircleUno.
        </p>

        <button className="px-8 py-4 bg-indigo-600 text-white rounded-xl text-lg font-semibold hover:bg-indigo-700 transition">
          Get Started
        </button>

      </section>

    </div>
  );
}