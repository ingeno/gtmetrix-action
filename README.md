# Run GTMetrix test action

This action uses GTMetrix API 2.0 and provides the following features :

- [Launch a GTMetrix test](#launch-a-gtmetrix-test)
- [Evaluate a GTMetrix report](#evaluate-a-gtmetrix-report)

## Example of job

```yml
  launch-gtmetrix-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: ingeno/gtmetrix-action@v1.0.0
        with:
          api_key: ${{ secrets.GTMETRIX_API_KEY }}
          configuration_file: ./config.yml
```

`api_key` and `configuration_file` are both required. In this example, the file config.yml would be at the root of the repository.

## Launch a GTMetrix test

You can configure the test launch parameters by using the exact same key as in the [API](https://gtmetrix.com/api/docs/2.0/#api-test-start).

### Example of configuration file

```yml
  poll_interval: 6
  test_configuration:
    report: lighthouse
    simulate_device: nexus_5
    url: https://www.google.com
    video: false
```

Only `test_configuration.url` is required. `poll_interval` defaults to 3.

## Evaluate a GTMetrix report

You can configure the requirement parameters by using the exact same key as in the [API](https://gtmetrix.com/api/docs/2.0/#api-report-by-id).

### Example of configuration file

```yml
  test_configuration:
    report: legacy
    url: https://www.google.com
    video: true
  requirements:
    structure_score: 95
    onload_duration: 4
    gtmetrix_grade: A
```

## Outputs

Outputs contains the every links in the [report response](https://gtmetrix.com/api/docs/2.0/#api-report-by-id) and every attributes except these ones : `browser`, `location` and `source`. Some outputs might not be present depending of your test parameters. For example, the `gtmetrix_grade` is only available when the test parameter `report` is `lighthouse`.

## Roadmap

- Retry on requirements failure
- Support [API rate limiting](https://gtmetrix.com/api/docs/2.0/#api-rate-limit)
