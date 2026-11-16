import pandas as pd
import numpy as np

def process_missing_data(df: pd.DataFrame, date_col: str = 'tarih', product_col: str = 'urun_id', price_col: str = 'fiyat', max_gap_days: int = 7) -> pd.DataFrame:
    
    df[date_col] = pd.to_datetime(df[date_col])
    df = df.sort_values(by=[product_col, date_col])
    
    processed_dfs = []
    
    for product_id, group in df.groupby(product_col):
        group = group.set_index(date_col).resample('D').asfreq()
        group[product_col] = product_id
        
        # Forward Fill (İleriye taşıma)
        group[price_col] = group[price_col].ffill(limit=max_gap_days)
        
        group = group.reset_index()
        processed_dfs.append(group)
        
    final_df = pd.concat(processed_dfs, ignore_index=True)
    return final_df

if __name__ == "__main__":
    data = {
        'tarih': ['2026-11-01', '2026-11-02', '2026-11-05', '2026-11-15'],
        'urun_id': ['elma_01', 'elma_01', 'elma_01', 'elma_01'],
        'fiyat': [10.0, 10.5, 11.0, 15.0]
    }
    test_df = pd.DataFrame(data)
    result = process_missing_data(test_df, max_gap_days=5)
    print("Eksik gün doldurma testi tamamlandı!")
    print(result.head(10))