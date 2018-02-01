from opalalgorithms.utils import AlgorithmRunner

if __name__ == "__main__":
    module_name = str(sys.argv[1])
    class_name = str(sys.argv[2])
    data_dir = str(sys.argv[3])
    number_of_threads = int(sys.argv[4])
    results_csv_path = str(sys.argv[5])
    parameters = str(sys.argv[6])
    
    mod = __import__(module_name, fromlist=[class_name])
    algorithmclass = getattr(mod, class_name)
    algorithmobj = algorithmclass()

    
    algorunner = AlgorithmRunner(algorithmobj)
    result = algorunner(data_dir, parameters, number_of_threads, results_csv_path)
    print(result)