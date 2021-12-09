# For these to work, first run 'pip install gensim termcolor nltk'
import gensim
from pprint import pprint
from termcolor import colored
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from collections import defaultdict
import sys
import os

'''
Loads the transcript documents and separates them into different sessions (videos).
'''
def load_transcript_words():
	files = ["transcript_full_part1.txt","transcript_full_part2.txt"]

	session_number = 0
	for filename in files:
		session_to_words = defaultdict(list)
		with open(filename) as f:
			for line in f.readlines():
				if line.startswith("Session "):
					session_number += 1
				elif line:
					tokens = tokenize(line)
					if len(tokens) > 0:
						for token in tokens:
							session_to_words[session_number].append(token)
	return session_to_words

'''
Loads a document and returns the words in a list.
'''
def load_words_from_file(file):
	words = []
	with open(file) as f:
		for line in f.readlines():
			tokens = tokenize(line)
			if len(tokens) > 0:
				for token in tokens:
					words.append(token)
	return words

'''
Tokenizes, lemmatizes and removes small words or stopwords (common).
'''
def tokenize(text):
    tokens = nltk.tokenize.word_tokenize(text.lower())
    tokens = [wordnet_lemmatizer.lemmatize(t) for t in tokens]
    tokens = [t for t in tokens if len(t) > 2 and t not in stopwords]
    return tokens

'''
Loads the dictionary without common or rare words.
'''
def load_dictionary(corpus):
	dictionary = gensim.corpora.Dictionary(corpus)
	dictionary.filter_extremes(no_below=2, no_above=0.25, keep_n=10000)
	return dictionary


# These are useful to tokenize text (above).
wordnet_lemmatizer = WordNetLemmatizer()
nltk.download('stopwords')
nltk.download('punkt')
nltk.download('wordnet')
stopwords = set(stopwords.words('english'))

if __name__ == '__main__':
	os.system('color')

	corpus = [doc for session, doc in load_transcript_words().items()]
	dictionary = load_dictionary(corpus);

	# Compute list(index, count) for words in dictionary after filtering.
	bow_corpus = [dictionary.doc2bow(doc) for doc in corpus]

	# Create a lda model with tf-idf vectorized corpus and dictionary
	# Manually pick number of topic and then based on perplexity scoring, tune the number of topics
	lda_model = gensim.models.LdaModel(bow_corpus,
	                                  id2word=dictionary,
	                                  num_topics=10,
	                                  passes=100,
	                                  random_state=1,
	                                  alpha='auto',
	                                  eta='auto',
	                                  per_word_topics=True)
	print(colored('All topics:','yellow'))
	pprint(lda_model.print_topics())

	# Compute list(index, count) for words in doc passed as argument after filtering.
	student_doc = load_words_from_file(sys.argv[1])
	bow_student_doc = dictionary.doc2bow(student_doc)

	# Classify the doc.
	topics_probs = lda_model[bow_student_doc][0]

	# Sort and print results.
	print()
	topics_probs.sort(key = lambda x: x[1], reverse=True)
	for topic, prob in topics_probs:
		print(colored('Topic ' + str(topic) + ': p=' + str(prob),'yellow'))

	print(colored('The best topic match was number ' + str(topics_probs[0][0]) + ' with ' + str(round(topics_probs[0][1],3)) + ' probability.','green'))
	print('These are the word probabilities for that topic:')
	print(colored(lda_model.print_topic(topics_probs[0][0]),'green'))
